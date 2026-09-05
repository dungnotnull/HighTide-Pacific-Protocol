import numpy as np

from hightide.risk import compute_risk, exceedance_prob


def test_exceedance_prob_known_normal_value():
    # P(X > 2.0) with X ~ N(1.0, 0.5): z = 2 -> ~0.02275
    p = exceedance_prob(mean=1.0, pred_se=0.5, threshold=2.0)
    assert abs(p - 0.02275) < 0.001


def test_exceedance_prob_degenerate_se():
    assert exceedance_prob(mean=2.0, pred_se=0.0, threshold=1.0) == 1.0
    assert exceedance_prob(mean=0.5, pred_se=0.0, threshold=1.0) == 0.0


def _country(code, trend_mm_yr, exceed_prob):
    return {
        "iso2": code,
        "name": code,
        "trend_mm_yr": trend_mm_yr,
        "exceedance_prob": exceed_prob,
    }


def test_compute_risk_weights_sum_to_one_and_rank_correctly():
    countries = [
        _country("TV", trend_mm_yr=6.0, exceed_prob=0.30),  # high risk
        _country("FJ", trend_mm_yr=3.0, exceed_prob=0.10),
        _country("WS", trend_mm_yr=1.0, exceed_prob=0.02),  # low risk
    ]
    scored = compute_risk(countries)
    weights = [c["allocation_weight"] for c in scored]
    assert abs(sum(weights) - 1.0) < 1e-9
    by_code = {c["iso2"]: c for c in scored}
    assert by_code["TV"]["allocation_weight"] > by_code["FJ"]["allocation_weight"]
    assert by_code["FJ"]["allocation_weight"] > by_code["WS"]["allocation_weight"]
    assert all(0.0 <= c["risk_index"] <= 1.0 for c in scored)
