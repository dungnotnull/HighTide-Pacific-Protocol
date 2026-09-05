"""End-to-end pipeline: data -> calibration -> forecast -> risk -> backtest."""

import json
from pathlib import Path

from hightide.backtest import run_backtest, select_params
from hightide.citations import citations_for
from hightide.forecast import forecast_series
from hightide.load import load_sea_level, MIN_OBS, OUTPUT_DIR
from hightide.risk import compute_risk, exceedance_prob
from hightide.stats import calibrate

CALIBRATION_YEARS = list(range(2005, 2015))
EVALUATION_YEARS = list(range(2015, 2026))
FORECAST_HORIZON = 5
TREND_FILE = OUTPUT_DIR.parent / "sea_level_trend.json"


def _round6(value):
    return round(float(value), 6)


def run_pipeline(data_path=None, output_dir=None):
    """Run the full pipeline; returns the four output dicts and writes JSON."""
    output_dir = Path(output_dir) if output_dir else OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)
    countries = load_sea_level(data_path)
    trend_countries = load_sea_level(TREND_FILE)

    # Dual-series design: trigger series (2005-2025) for anomaly detection,
    # 30-year official trend series (1993-2023, meters) for trend/forecast.
    qualifying = {
        code: c for code, c in countries.items()
        if len(c["years"]) >= MIN_OBS and code in trend_countries
    }

    # 1. Calibration per country (trigger series)
    calibrations = {}
    for code, c in qualifying.items():
        by_year = dict(zip(c["years"], c["values"]))
        cal_values = [by_year[y] for y in CALIBRATION_YEARS if y in by_year]
        calibrations[code] = calibrate(
            [y for y in CALIBRATION_YEARS if y in by_year], cal_values
        )

    # 2. Forecasts: trigger series (acute anomalies) + trend series (chronic)
    forecasts = {}
    for code, c in qualifying.items():
        t = trend_countries[code]
        forecasts[code] = {
            "name": c["name"],
            "history_years": c["years"],
            "history_values": [_round6(v) for v in c["values"]],
            "trigger_forecast": forecast_series(
                c["years"], c["values"], FORECAST_HORIZON
            ),
            "trend_years": t["years"],
            "trend_values": [_round6(v) for v in t["values"]],
            "trend_forecast": forecast_series(
                t["years"], t["values"], FORECAST_HORIZON
            ),
        }

    # 3. Risk + allocation: chronic trend from the 30-year series,
    #    warning-level exceedance from the trigger series (trend + 1 sigma)
    risk_inputs = []
    for code, c in qualifying.items():
        f = forecasts[code]
        next_year = f["trigger_forecast"]["forecast_years"][0]
        cal = calibrations[code]
        warn_threshold = cal.intercept + cal.slope * next_year + 1.0 * cal.sigma
        risk_inputs.append(
            {
                "iso2": code,
                "name": c["name"],
                "trend_mm_yr": _round6(
                    f["trend_forecast"]["slope"] * 1000.0
                ),
                "exceedance_prob": _round6(
                    exceedance_prob(
                        mean=f["trigger_forecast"]["mean"][0],
                        pred_se=f["trigger_forecast"]["next_year_pred_se"],
                        threshold=warn_threshold,
                    )
                ),
            }
        )
    scored = compute_risk(risk_inputs)
    risk_allocation = {
        "method": "risk_index = 0.5*norm(trend_mm_yr) + 0.5*norm(exceedance_prob); weights = index/sum",
        "countries": {c["iso2"]: c for c in scored},
    }

    # 4. Param sweep + backtest with allocation weights
    weights = {c["iso2"]: c["allocation_weight"] for c in scored}
    k, n = select_params(qualifying, CALIBRATION_YEARS, EVALUATION_YEARS, weights)
    backtest = run_backtest(
        qualifying, CALIBRATION_YEARS, EVALUATION_YEARS, k, n, weights
    )

    # 5. Trigger params for contracts (float + int scaled by 1e6)
    trigger_params = {
        "calibration_window": [CALIBRATION_YEARS[0], CALIBRATION_YEARS[-1]],
        "evaluation_window": [EVALUATION_YEARS[0], EVALUATION_YEARS[-1]],
        "scaling_factor": 1_000_000,
        "k": k,
        "n_consecutive": n,
        "countries": {
            code: {
                "name": qualifying[code]["name"],
                "intercept": _round6(cal.intercept),
                "slope": _round6(cal.slope),
                "sigma": _round6(cal.sigma),
                "intercept_scaled": int(round(cal.intercept * 1e6)),
                "slope_scaled": int(round(cal.slope * 1e6)),
                "sigma_scaled": int(round(cal.sigma * 1e6)),
                "k": k,
                "n_consecutive": n,
            }
            for code, cal in calibrations.items()
        },
    }

    outputs = {
        "trigger_params": trigger_params,
        "forecasts": forecasts,
        "risk_allocation": risk_allocation,
        "backtest_report": backtest,
    }
    stamped_outputs = {}
    for name, payload in outputs.items():
        stamped = {**payload, "citations": citations_for(name)}
        stamped_outputs[name] = stamped
        path = output_dir / f"{name}.json"
        path.write_text(
            json.dumps(stamped, indent=1, ensure_ascii=False), encoding="utf-8"
        )
    return stamped_outputs
