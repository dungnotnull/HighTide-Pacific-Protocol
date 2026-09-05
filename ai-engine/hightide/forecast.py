"""Deterministic OLS trend forecast with prediction intervals."""

import numpy as np
import statsmodels.api as sm


def forecast_series(years, values, horizon=5):
    """Fit OLS on the full series, forecast `horizon` years ahead.

    Returns dict with forecast years, mean path, 80%/95% prediction
    intervals (obs-level), slope/intercept, and the prediction standard
    error of the first forecast year (used by risk scoring).
    """
    x = sm.add_constant(np.asarray(years, dtype=float))
    y = np.asarray(values, dtype=float)
    model = sm.OLS(y, x).fit()

    last = max(years)
    fyears = np.arange(last + 1, last + 1 + horizon, dtype=float)
    pred = model.get_prediction(sm.add_constant(fyears))
    frame80 = pred.summary_frame(alpha=0.20)
    frame95 = pred.summary_frame(alpha=0.05)

    def col(frame, name):
        return [round(float(v), 6) for v in frame[name]]

    return {
        "forecast_years": [int(v) for v in fyears],
        "mean": col(frame80, "mean"),
        "lo80": col(frame80, "obs_ci_lower"),
        "hi80": col(frame80, "obs_ci_upper"),
        "lo95": col(frame95, "obs_ci_lower"),
        "hi95": col(frame95, "obs_ci_upper"),
        "intercept": round(float(model.params[0]), 6),
        "slope": round(float(model.params[1]), 6),
        "next_year_pred_se": float(pred.se_obs[0]),
    }
