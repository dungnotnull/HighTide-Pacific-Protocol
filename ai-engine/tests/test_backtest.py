import numpy as np

from hightide.backtest import run_backtest, select_params, MOCK_POOL_USD

CAL_YEARS = list(range(2005, 2015))  # 2005-2014
EVAL_YEARS = list(range(2015, 2026))  # 2015-2025


def _spike_country(code="TV", spike_years=(2018, 2019), spike_sigma=3.0):
    """Flat trend with a calibrated noise floor and an injected spike.

    Seed 1 is chosen so the noise-only floor stays well below k (max
    |z| < 0.7 sigma after calibration), keeping the trigger tests
    unambiguous.
    """
    rng = np.random.default_rng(1)
    noise = 0.001
    years = CAL_YEARS + EVAL_YEARS
    values = []
    for y in years:
        v = 0.05 + rng.normal(0, noise)
        if y in spike_years:
            v += spike_sigma * noise
        values.append(v)
    return {code: {"name": code, "years": years, "values": values}}


def test_backtest_fires_on_injected_spike_with_correct_tier():
    report = run_backtest(
        _spike_country(),
        calibration_years=CAL_YEARS,
        evaluation_years=EVAL_YEARS,
        k=2.0,
        n_consecutive=2,
        weights={"TV": 1.0},
    )
    events = report["events"]
    assert len(events) == 1
    ev = events[0]
    assert ev["iso2"] == "TV"
    assert ev["end_year"] == 2019
    assert ev["start_year"] == 2018
    assert ev["peak_z"] >= 2.9  # ~3 sigma injected
    assert ev["tier_payout_fraction"] == 1.0
    assert ev["payout_usd"] == MOCK_POOL_USD  # 100% tier x weight 1.0 x pool


def test_backtest_replay_yields_same_single_event():
    countries = _spike_country()
    r1 = run_backtest(countries, CAL_YEARS, EVAL_YEARS, 2.0, 2, {"TV": 1.0})
    r2 = run_backtest(countries, CAL_YEARS, EVAL_YEARS, 2.0, 2, {"TV": 1.0})
    assert r1["events"] == r2["events"]


def test_backtest_no_spike_no_events():
    countries = _spike_country(spike_years=())
    report = run_backtest(countries, CAL_YEARS, EVAL_YEARS, 2.0, 2, {"TV": 1.0})
    assert report["events"] == []
    assert report["summary"]["total_events"] == 0


def test_consecutive_events_do_not_leak_peak_z():
    """Two separate spikes (N=1) must tier independently: the second
    event's peak_z reflects only its own reading, not the prior peak.

    Seed 1 is chosen so both spikes fire cleanly at N=1 with no
    noise-floor false positives (seed 3 poisons calibration, leaving
    all z below k).
    """
    rng = np.random.default_rng(1)
    noise = 0.001
    years = CAL_YEARS + EVAL_YEARS
    values = []
    for y in years:
        v = 0.05 + rng.normal(0, noise)
        if y == 2018:
            v += 3.0 * noise
        if y == 2019:
            v += 2.2 * noise
        values.append(v)
    countries = {"TV": {"name": "TV", "years": years, "values": values}}
    report = run_backtest(
        countries,
        calibration_years=CAL_YEARS,
        evaluation_years=EVAL_YEARS,
        k=2.0,
        n_consecutive=1,
        weights={"TV": 1.0},
    )
    events = report["events"]
    assert [ev["end_year"] for ev in events] == [2018, 2019]
    assert events[0]["peak_z"] >= 2.9
    assert events[0]["tier_payout_fraction"] == 1.0
    assert 1.9 <= events[1]["peak_z"] < 2.9
    assert events[1]["tier_payout_fraction"] == 0.6


def test_select_params_falls_back_when_too_few_events():
    countries = _spike_country(spike_years=(2015, 2016), spike_sigma=3.5)
    chosen = select_params(countries, CAL_YEARS, EVAL_YEARS, {"TV": 1.0})
    assert chosen == (1.0, 1)


def test_select_params_picks_most_conservative_when_eligible():
    """5 countries x 2-year spikes in 2021-2022 (documented La Nina high
    years) satisfy eligibility at the most conservative (k=2.0, N=2),
    so it must be chosen first.

    Seeds 102/104/111/114/115 were selected (from a scan of 100-159)
    because each fires exactly one clean 2022 event at (2.0, 2): e.g.
    seeds 100 and 103 have calibration noise that drags spike z below k.
    """
    countries = {}
    for code, seed in zip(["TV", "FJ", "WS", "KI", "SB"], [102, 104, 111, 114, 115]):
        rng = np.random.default_rng(seed)
        noise = 0.001
        years = CAL_YEARS + EVAL_YEARS
        values = []
        for y in years:
            v = 0.05 + rng.normal(0, noise)
            if y in (2021, 2022):
                v += 3.5 * noise
            values.append(v)
        countries[code] = {"name": code, "years": years, "values": values}
    weights = {code: 0.2 for code in countries}
    chosen = select_params(countries, CAL_YEARS, EVAL_YEARS, weights)
    assert chosen == (2.0, 2)
