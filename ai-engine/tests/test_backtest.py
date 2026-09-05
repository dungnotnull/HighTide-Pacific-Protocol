import numpy as np

from hightide.backtest import run_backtest, select_params, MOCK_POOL_USD

CAL_YEARS = list(range(2005, 2015))  # 2005-2014
EVAL_YEARS = list(range(2015, 2026))  # 2015-2025


def _spike_country(code="TV", spike_years=(2018, 2019), spike_sigma=3.0):
    """Flat trend with a calibrated noise floor and an injected spike.

    Seed 1 is chosen so the noise-only floor stays well below k (max
    |z| < 0.7 after calibration), keeping the trigger tests unambiguous.
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


def test_select_params_returns_candidate_from_grid():
    countries = _spike_country(spike_years=(2015, 2016), spike_sigma=3.5)
    chosen = select_params(countries, CAL_YEARS, EVAL_YEARS, {"TV": 1.0})
    assert chosen in {(2.0, 2), (2.0, 1), (1.5, 2), (1.5, 1), (1.0, 2), (1.0, 1)}
