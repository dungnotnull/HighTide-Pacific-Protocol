"""Trend-adjusted trigger statistics for the HighTide protocol.

Threshold(year) = intercept + slope*year + k*sigma, where (intercept, slope,
sigma) come from an OLS fit + residual std over the calibration window.
This makes triggers fire on acute anomalies above the rising long-term
trend (e.g. ENSO-driven anomalies; in the western tropical Pacific the highs coincide with La Nina years) rather than on the trend itself.
"""

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class Calibration:
    intercept: float
    slope: float
    sigma: float


@dataclass
class TriggerState:
    streak: int = 0
    best_z: float = 0.0


def calibrate(years, values):
    """OLS trend + residual sample std over the calibration window."""
    x = np.asarray(years, dtype=float)
    y = np.asarray(values, dtype=float)
    slope, intercept = np.polyfit(x, y, 1)
    residuals = y - (intercept + slope * x)
    sigma = float(np.std(residuals, ddof=1))
    return Calibration(float(intercept), float(slope), sigma)


def threshold(cal, year, k):
    return cal.intercept + cal.slope * year + k * cal.sigma


def zscore(cal, year, value):
    if cal.sigma == 0:
        return 0.0
    expected = cal.intercept + cal.slope * year
    return (value - expected) / cal.sigma


def tier_for(z):
    """Payout fraction of allocation by peak anomaly strength."""
    if z >= 3.0:
        return 1.0
    if z >= 2.0:
        return 0.6
    if z >= 1.0:
        return 0.3
    return 0.0


def update_trigger(state, z, k, n_consecutive):
    """Advance the trigger state machine by one reading.

    Returns (state, fired). Fires exactly when the streak reaches
    n_consecutive, then resets the streak (a new event requires the
    anomaly to dip below k and build up again).
    """
    if z >= k:
        state.streak += 1
        state.best_z = max(state.best_z, z)
    else:
        state.streak = 0
        state.best_z = 0.0
    fired = state.streak == n_consecutive
    if fired:
        state.streak = 0
        # best_z is consumed by the caller before resetting
    return state, fired
