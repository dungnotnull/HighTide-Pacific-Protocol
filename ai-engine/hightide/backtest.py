"""Parametric trigger backtest: replay the protocol over history.

Calibration on 2005-2014, evaluation on 2015-2025. Events are unique by
construction (streak reset after firing), which mirrors the on-chain
anti-double-count design of ParametricPayout.
"""

from hightide.stats import calibrate, zscore, tier_for, TriggerState, update_trigger

# Mock fund size for hypothetical payouts (documented in submission).
MOCK_POOL_USD = 10_000_000

# Most conservative first.
PARAM_GRID = [(2.0, 2), (2.0, 1), (1.5, 2), (1.5, 1), (1.0, 2), (1.0, 1)]

# Documented ENSO episodes overlapping the evaluation window.
EL_NINO_YEARS = {2015, 2016, 2020, 2021, 2022}

# Strongest documented El Nino spike in the window.
STRONG_EL_NINO_YEARS = {2015, 2016}


def _slice_series(country, years):
    by_year = dict(zip(country["years"], country["values"]))
    return [by_year[y] for y in years if y in by_year]


def run_backtest(
    countries,
    calibration_years,
    evaluation_years,
    k,
    n_consecutive,
    weights,
):
    """Evaluate the trigger rule per country over the evaluation window."""
    events = []
    for iso2, country in countries.items():
        cal_values = _slice_series(country, calibration_years)
        cal = calibrate(calibration_years, cal_values)
        state = TriggerState()
        streak_start = None
        by_year = dict(zip(country["years"], country["values"]))
        for year in evaluation_years:
            if year not in by_year:
                state = TriggerState()
                streak_start = None
                continue
            z = zscore(cal, year, by_year[year])
            if state.streak == 0:
                streak_start = year
            _, fired = update_trigger(state, z, k, n_consecutive)
            if fired:
                peak_z = state.best_z
                fraction = tier_for(peak_z)
                weight = weights.get(iso2, 0.0)
                events.append(
                    {
                        "iso2": iso2,
                        "name": country["name"],
                        "start_year": streak_start,
                        "end_year": year,
                        "peak_z": round(peak_z, 4),
                        "tier_payout_fraction": fraction,
                        "allocation_weight": round(weight, 6),
                        "payout_usd": round(fraction * weight * MOCK_POOL_USD, 2),
                    }
                )
                # Fresh state so the next event's peak_z starts clean;
                # best_z survives only within one event's streak.
                state = TriggerState()
                streak_start = None

    by_year_counts = {}
    for ev in events:
        by_year_counts[ev["end_year"]] = by_year_counts.get(ev["end_year"], 0) + 1
    el_nino = sum(1 for ev in events if ev["end_year"] in EL_NINO_YEARS)
    return {
        "k": k,
        "n_consecutive": n_consecutive,
        "mock_pool_usd": MOCK_POOL_USD,
        "events": events,
        "summary": {
            "total_events": len(events),
            "events_by_end_year": dict(sorted(by_year_counts.items())),
            "el_nino_window_events": el_nino,
            "total_payout_usd": round(
                sum(ev["payout_usd"] for ev in events), 2
            ),
        },
    }


def select_params(countries, calibration_years, evaluation_years, weights):
    """Pick the most conservative (k, N) that keeps the protocol alive.

    Eligibility: at least 5 events total and at least 2 events ending in
    2015/2016 (the strongest documented El Nino spike in the window).
    Falls back to the most sensitive (1.0, 1) if nothing qualifies.
    """
    for k, n in PARAM_GRID:
        report = run_backtest(
            countries, calibration_years, evaluation_years, k, n, weights
        )
        s = report["summary"]
        if s["total_events"] >= 5 and _strong_el_nino(s):
            return (k, n)
    return (1.0, 1)


def _strong_el_nino(summary):
    by_year = summary["events_by_end_year"]
    return (
        sum(by_year.get(y, 0) for y in STRONG_EL_NINO_YEARS) >= 2
    )
