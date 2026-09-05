# HighTide AI Engine

Produces the scientific layer of the HighTide Protocol from real Pacific
Data Hub data: parametric trigger parameters, forecasts with uncertainty,
risk-based fund allocation, and a historical backtest with ENSO validation.

## Method

- **Dual-series design.** The trigger series (yearly mean of monthly
  satellite sea-level anomaly, `data/sea_level.json`, 13 PICs, 2005-2025)
  drives anomaly detection; the official PDH indicator
  (`CLIMATE_CHANGE_SEA_INDICATORS`, meters, 1993-2023, extracted to
  `data/sea_level_trend.json`) drives long-term trend and forecast,
  because ENSO phase contaminates the 2005-2025 trend.
- **Calibration (2005-2014, trigger series):** OLS trend per country;
  sigma = residual sample std. Threshold(year) = intercept + slope*year
  + k*sigma - trend-adjusted, so triggers fire on acute anomalies above
  the rising trend, not on the trend itself.
- **Forecast:** OLS on the full series with 80%/95% prediction intervals
  (statsmodels `get_prediction`). 21-31 annual points per country -
  statistical forecasting, deliberately not deep learning.
- **Risk / allocation:** risk_index = 0.5*norm(trend mm/yr from the
  30-year series) + 0.5*norm(P(next-year trigger reading > trend + 1
  sigma)); allocation weights are normalized risk indices (sum to 1).
- **Backtest (2015-2025):** parameter sweep k in {2.0, 1.5, 1.0} x
  N in {2, 1}, most conservative first; eligibility: >= 5 events and
  >= 2 events ending in the documented La Nina high years 2020-2022.
  In the western tropical Pacific, El Nino years (2015-16) produce
  sea-level drops while La Nina years produce the highs this trigger
  detects (Widlansky et al. 2014, Journal of Climate).
- **Payouts:** hypothetical, at a per-event reference pool of
  USD 10,000,000 (mock); cumulative payouts across events can exceed
  the reference pool by design.

## Chosen parameters (from real data, run 2026-09-05)

- k = 2.0, N = 1 (most conservative eligible; not the fallback)
- 13 trigger events across 2015-2025; 9 end inside the ENSO window
  (La Nina highs 2020-2022); Tuvalu triggers 2018, 2020, 2021, 2022
- Total hypothetical payouts: USD 14,717,608

## Scientific traceability

Every output JSON in `data/protocol/` carries a `citations` object with
stable reference IDs resolved in `docs/research/REFERENCES.md` (verified
bibliography: IPCC AR6, peer-reviewed ENSO sea-level science, parametric
risk financing precedents, UNFCCC Loss and Damage policy).

## Run

    pip install -r ai-engine/requirements.txt
    python -m pytest ai-engine/tests -v
    python ai-engine/scripts/extract_trend.py   # only if data/sea_level_trend.json is missing (requires data/pacific_data_all.xlsx)
    python ai-engine/scripts/run_all.py

Outputs are written to `data/protocol/` (committed; consumed by the
smart contracts, the keeper, and the dashboard).

Note: `extract_trend.py` needs the source Excel which is gitignored;
the generated `sea_level_trend.json` is committed, so the pipeline runs
without the Excel.
