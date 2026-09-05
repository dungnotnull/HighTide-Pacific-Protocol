import numpy as np

from hightide.stats import (
    Calibration,
    calibrate,
    threshold,
    zscore,
    tier_for,
    TriggerState,
    update_trigger,
)


def _noisy_linear(years, intercept, slope, noise, seed=7):
    rng = np.random.default_rng(seed)
    return [intercept + slope * y + rng.normal(0, noise) for y in years]


def test_calibrate_recovers_trend_within_tolerance():
    years = list(range(2005, 2015))
    values = _noisy_linear(years, intercept=0.05, slope=0.006, noise=0.002)
    cal = calibrate(years, values)
    assert isinstance(cal, Calibration)
    assert abs(cal.slope - 0.006) < 0.001
    # The year-0 intercept is an extrapolation from a window centered near
    # year 2010, so its error is ~(slope error) * 2010. OLS slope error of
    # ~1e-5 for this seed shifts the intercept by ~0.018.
    assert abs(cal.intercept - 0.05) < 0.02
    assert 0.0 < cal.sigma < 0.01


def test_threshold_is_trend_plus_k_sigma():
    cal = Calibration(intercept=0.05, slope=0.006, sigma=0.01)
    assert abs(threshold(cal, 2020, 2.0) - (0.05 + 0.006 * 2020 + 0.02)) < 1e-12


def test_zscore_measures_anomaly_above_trend():
    cal = Calibration(intercept=0.05, slope=0.006, sigma=0.01)
    expected = 0.05 + 0.006 * 2015
    assert abs(zscore(cal, 2015, expected + 0.03) - 3.0) < 1e-9
    assert abs(zscore(cal, 2015, expected)) < 1e-9


def test_zscore_zero_sigma_guard():
    cal = Calibration(intercept=0.0, slope=0.0, sigma=0.0)
    assert zscore(cal, 2015, 5.0) == 0.0


def test_tier_boundaries():
    assert tier_for(0.5) == 0.0
    assert tier_for(1.0) == 0.3
    assert tier_for(1.9) == 0.3
    assert tier_for(2.0) == 0.6
    assert tier_for(2.9) == 0.6
    assert tier_for(3.0) == 1.0


def test_trigger_fires_after_n_consecutive_and_resets():
    state = TriggerState()
    # k=2, N=2: first year above threshold only raises streak
    state, fired = update_trigger(state, z=2.1, k=2.0, n_consecutive=2)
    assert fired is False and state.streak == 1
    # second consecutive year fires
    state, fired = update_trigger(state, z=2.5, k=2.0, n_consecutive=2)
    assert fired is True and state.best_z == 2.5
    # streak reset after firing
    assert state.streak == 0
    # a below-threshold year resets an unfinished streak
    state, fired = update_trigger(state, z=2.2, k=2.0, n_consecutive=2)
    state, fired = update_trigger(state, z=0.5, k=2.0, n_consecutive=2)
    assert fired is False and state.streak == 0
