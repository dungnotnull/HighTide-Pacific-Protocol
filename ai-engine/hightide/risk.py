"""Risk index and pool allocation weights.

risk_index = 0.5 * norm(trend_mm_yr) + 0.5 * norm(exceedance_prob),
where exceedance_prob is the warning-level probability that next year's
reading exceeds trend + 1 sigma. Allocation weights are the normalized
risk indices (sum to 1).
"""

from scipy.stats import norm


def exceedance_prob(mean, pred_se, threshold):
    """P(reading > threshold) under N(mean, pred_se)."""
    if pred_se <= 0:
        return 1.0 if mean > threshold else 0.0
    return float(norm.sf(threshold, loc=mean, scale=pred_se))


def _minmax(values):
    lo, hi = min(values), max(values)
    if hi == lo:
        return [0.0] * len(values)
    return [(v - lo) / (hi - lo) for v in values]


def compute_risk(countries):
    """Score countries and attach allocation weights.

    Input: list of dicts with keys iso2, name, trend_mm_yr,
    exceedance_prob. Returns the same list extended with risk_index
    (0-1) and allocation_weight (sums to 1.0).
    """
    trends = [c["trend_mm_yr"] for c in countries]
    probs = [c["exceedance_prob"] for c in countries]
    trend_n = _minmax(trends)
    prob_n = _minmax(probs)

    indices = [0.5 * t + 0.5 * p for t, p in zip(trend_n, prob_n)]
    total = sum(indices)
    weights = [i / total for i in indices] if total > 0 else indices

    scored = []
    for c, idx, w in zip(countries, indices, weights):
        scored.append(
            {
                **c,
                "risk_index": round(idx, 6),
                "allocation_weight": round(w, 6),
            }
        )
    # rounding can shift the sum by ~1e-6; acceptable, documented
    return scored
