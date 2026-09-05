import numpy as np

from hightide.forecast import forecast_series


def test_forecast_recovers_linear_trend_and_intervals_nest():
    rng = np.random.default_rng(42)
    years = list(range(2005, 2026))
    values = [0.05 + 0.006 * (y - 2005) + rng.normal(0, 0.001) for y in years]
    out = forecast_series(years, values, horizon=5)

    assert out["forecast_years"] == [2026, 2027, 2028, 2029, 2030]
    assert abs(out["slope"] - 0.006) < 0.0005
    assert len(out["mean"]) == 5
    # monotone continuation of the trend
    assert all(b > a for a, b in zip(out["mean"], out["mean"][1:]))
    # 80% interval nested inside 95% interval
    for lo80, hi80, lo95, hi95 in zip(
        out["lo80"], out["hi80"], out["lo95"], out["hi95"]
    ):
        assert lo95 < lo80 < hi80 < hi95
    # prediction standard error available for risk scoring
    assert out["next_year_pred_se"] > 0


def test_forecast_is_deterministic():
    years = list(range(2005, 2026))
    values = [0.05 + 0.006 * (y - 2005) for y in years]
    a = forecast_series(years, values, horizon=3)
    b = forecast_series(years, values, horizon=3)
    assert a == b
