import json

from hightide.pipeline_shim import run_pipeline  # thin wrapper for tests


def test_pipeline_outputs_valid_and_deterministic(tmp_path):
    out1 = run_pipeline(output_dir=tmp_path / "a")
    out2 = run_pipeline(output_dir=tmp_path / "b")

    for name in [
        "trigger_params.json",
        "forecasts.json",
        "risk_allocation.json",
        "backtest_report.json",
    ]:
        a = json.loads((tmp_path / "a" / name).read_text(encoding="utf-8"))
        b = json.loads((tmp_path / "b" / name).read_text(encoding="utf-8"))
        assert a == b, f"{name} not deterministic"

    # trigger params: scaled ints present for Solidity, floats match
    params = out1["trigger_params"]
    assert set(params["countries"]).issuperset({"TV", "FJ", "KI"})
    for p in params["countries"].values():
        assert p["sigma_scaled"] == int(round(p["sigma"] * 1e6))
        assert p["k"] > 0 and p["n_consecutive"] >= 1

    # allocation weights sum to ~1
    weights = out1["risk_allocation"]["countries"]
    assert abs(sum(c["allocation_weight"] for c in weights.values()) - 1.0) < 1e-4

    # dual-series: 30-year trend data present, trend rate scientifically sane
    tv = out1["forecasts"]["TV"]
    assert tv["trend_years"][0] == 1993 and len(tv["trend_years"]) == 31
    assert "trigger_forecast" in tv and "trend_forecast" in tv
    risk_tv = out1["risk_allocation"]["countries"]["TV"]
    assert 0 < risk_tv["trend_mm_yr"] < 20  # mm/yr: plausible SLR bound

    # backtest summary present with chosen params echoed in trigger params
    assert out1["backtest_report"]["summary"]["total_events"] >= 0
    chosen = (
        out1["backtest_report"]["k"],
        out1["backtest_report"]["n_consecutive"],
    )
    sample = next(iter(params["countries"].values()))
    assert (sample["k"], sample["n_consecutive"]) == chosen

    # every output carries its scientific citations (verified references)
    for name in [
        "trigger_params",
        "forecasts",
        "risk_allocation",
        "backtest_report",
    ]:
        cites = out1[name]["citations"]
        assert len(cites) >= 2 and all(len(ids) > 0 for ids in cites.values())
