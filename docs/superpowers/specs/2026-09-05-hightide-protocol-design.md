# HighTide Protocol — Design Spec

**Date:** 2026-09-05
**Status:** Approved (pending user spec review)
**Hackathon:** IEEE ClimateChain Global Hackathon 2026 (https://ieee-climatechain-hack.devpost.com/)
**Track:** 1 — Carbon Markets & Emissions Transparency

## 1. One-liner

An AI-forecasted, blockchain-triggered Loss & Damage fund that pays Pacific Island communities automatically when verified sea-level data crosses scientific thresholds — funded by historical emissions responsibility, immune to double-counting.

**Narrative hook (from the existing project):** "PICs emit the least but risk losing the most." HighTide turns that story into a mechanism: the carbon debt, repaid by the tide.

## 2. Hackathon alignment

### Track 1 justification
- **Emissions tracking:** the fund's contribution weights are derived from real historical per-capita GHG data (1970–2024) and major-emitter context — an on-chain emissions responsibility ledger.
- **Smart contracts to prevent double counting:** literal implementation — each trigger event can be paid exactly once; replay attempts are rejected on-chain.
- **Transparent carbon/climate finance platform:** every pool balance, trigger, and payout is verifiable on a public testnet explorer.

### Judging criteria mapping
| Criterion | How HighTide scores |
|---|---|
| Climate Impact | Direct mechanism for UN Loss & Damage disbursement — a real COP31 pain point (slow, opaque, contested allocation) |
| Innovation & Creativity | Climate-justice fintech: historical responsibility → automated repayment. Distinct from carbon-credit clones |
| Technical Execution | Three real layers: AI forecasting on real data + EIP-712 signed oracle verification on-chain + parametric smart contracts with anti-replay |
| Practical Usefulness | Loss & Damage Fund (pledged ~$700M under UNFCCC) lacks trusted disbursement rails; backtest proves workable thresholds |
| Presentation | Existing award-style scrollytelling site becomes the public dashboard; kinescopic demo (El Niño replay → instant payout → rejected replay) |

## 3. Actors

| Actor | Role | In demo |
|---|---|---|
| Donor / Funder | Deposits test tokens into the pool, weighted by emissions responsibility | Script + dashboard button |
| Oracle | Submits signed sea-level readings | Keeper script replaying real PDH history |
| AI Engine | Forecasts, risk scores, allocation weights | Python service on real data |
| Beneficiary (PIC) | Registered country wallet receiving payouts | Test wallets per country |
| Public / Judges | Verify everything via dashboard + testnet explorer | Vercel URL + explorer links |

## 4. Architecture

```
NEXT.JS DASHBOARD (reuse existing site + new Act 3)
  Act 1-2: Cause -> Reality (existing scrollytelling, kept)
  Act 3: THE PROTOCOL (pool status, risk map, trigger feed,
         payout history, testnet links)
        | reads JSON/API              | listens events
  AI ENGINE (Python)          SMART CONTRACTS (Solidity, Hardhat)
    forecast + uncertainty      ClimateDataRegistry (hash anchors,
    risk score -> allocation    provenance)
    backtest 2015-2025          LossDamagePool (funds, allocations)
        |                       ParametricPayout (EIP-712 verify,
        v                        trigger tiers, anti-replay)
  KEEPER / ORACLE (TS script) -> signed readings -> contracts
  Base Sepolia testnet
```

## 5. Components

### 5.1 Smart contracts (`/contracts`, Hardhat + OpenZeppelin)
- **MockFundToken (ERC20):** stand-in for fund currency on testnet.
- **ClimateDataRegistry:** anchors dataset/output hashes (source, indicator, period); emits audit events.
- **HighTidePool** (merges the earlier LossDamagePool + ParametricPayout design — one custody+trigger contract reduces cross-contract calls): holds token balances; per-country params + allocation weights loaded from `data/protocol/trigger_params.json` / `risk_allocation.json` (1e6 fixed-point); verifies oracle EIP-712 signatures; evaluates trend-adjusted thresholds with the N-consecutive state machine mirroring `hightide/stats.py`; tiered payout (z>=3: 100%, >=2: 60%, >=1: 30% of allocation at the reference pool); one payout per event id and one evaluation per (country, year) — anti-double-count; pro-rata when pool short with outstanding remainder tracked.

### 5.2 AI Engine (`/ai-engine`, Python)
- **Forecast:** per-country sea-level trend + prediction intervals (80/95%) on the 30-year trend series (1993–2023, meters) — statsmodels statistical forecasting, not deep learning (scientific honesty: ~31 annual points per country). A separate forecast of the trigger series feeds the warning-level exceedance probability.
- **Risk scoring:** blend of chronic exposure (trend mm/yr from the 30-year series) and acute anomaly risk (P(next-year trigger reading > trend + 1 sigma)) -> normalized risk index -> pool allocation weights. Output JSON hash-anchored via ClimateDataRegistry.
- **Backtest:** replay protocol over 2015–2025 against real data (calibration on 2005–2014); report trigger dates, tiers, hypothetical payouts; validate against documented ENSO episodes — in the western tropical Pacific, HIGH sea-level anomalies coincide with La Niña (2020–22) while El Niño (2015–16) produces drops [WIDLANSKY-2014], so eligibility validates on 2020–22 events. This is the credibility centerpiece.

### 5.3 Keeper / Oracle (`/keeper`, TypeScript)
- Holds oracle key; replays real PDH series as time-accelerated signed readings; exposes a "run demo scenario" entry point (El Niño 2015–16).

### 5.4 Dashboard (existing Next.js)
- Acts 1–2 unchanged.
- Act 3 "The Protocol": live pool balance, per-country risk table/map (AI output), trigger event feed, payout history, per-chart hash-provenance links to testnet explorer.
- Every displayed metric traces to an on-chain anchor or signed source.

## 6. Trigger design (scientific core)

| Item | Definition |
|---|---|
| Trigger series | `sea_level.json`: yearly mean of monthly satellite SLA (`pacific_sla_monthly_satelite`), 13 PICs, 2005–2025 — verified real (matches source Excel); unit label inconsistent in source ("mm") — treated as relative anomaly units, thresholds are trend-relative so unit-invariant |
| Trend series | `sea_level_trend.json` (extracted from `CLIMATE_CHANGE_SEA_INDICATORS`): annual, METER, 1993–2023, official PDH climate indicator — used for long-term trend, forecast and the trend component of risk |
| Why dual-series | ENSO phase contaminates the 2005–2025 trigger series trend (e.g. Tuvalu OLS ≈ 45 mm/yr — not credible SLR); the 30-year meter series gives a scientifically defensible trend (Tuvalu ≈ 4 mm/yr, consistent with literature) |
| Baseline (calibration window) | Per-country OLS trend + residual sigma over 2005–2014 of the trigger series |
| Trigger threshold | Reading >= trend(year) + k·sigma (initial k=2; backtest may revise, final value documented in README) |
| Persistence | N=2 consecutive readings above threshold (anti-noise) |
| Payout tiers | 1–2 sigma: 30% of allocation; 2–3 sigma: 60%; >3 sigma: 100% |
| Backtest window | 2015–2025 (excludes calibration window, avoids threshold contamination) |
| Demo event | La Niña-driven HIGH sea-level anomalies 2020–22 (real, in dataset). In the western tropical Pacific El Niño years (2015–16) produce sea-level DROPS of 20–30 cm [WIDLANSKY-2014] — triggers fire on highs only, so param-sweep eligibility validates against 2020–22 |
| Production path note | Annual aggregation for prototype; the source is monthly and Plan 3 (keeper) may replay monthly readings for a more realistic demo; production ingests monthly PSMSL/NOAA tide-gauge readings (documented in README) |

## 7. Mock vs real (submission honesty table)

| Real | Mock (disclosed) |
|---|---|
| PDH climate data | Fund = test tokens |
| AI forecasts from real data | Oracle = our server replaying history |
| Contracts on public testnet | Time acceleration for demo |
| Signature verification, anti-replay, provenance | Single oracle (production path: multi-oracle quorum, documented) |

## 8. Error handling & edge cases
- **Pool insufficiency:** pro-rata payout; remainder owed tracked in contract state.
- **Missing readings:** trigger evaluation pauses until N consecutive readings resume.
- **Oracle compromise:** production path documented (multi-oracle quorum + Chainlink adapter); demo uses single registered oracle.
- **Data gaps per country:** risk engine requires minimum history (>= 15 annual observations); countries below threshold excluded from allocation (all 13 current countries qualify with n=21).

## 9. Testing strategy
- **Contracts (Hardhat/Chai):** signature acceptance/rejection, trigger on/off, tier math, replay rejection, pro-rata math.
- **AI:** backtest script reproducible (fixed seed, deterministic pipeline); sanity checks on forecast intervals.
- **E2E:** demo scenario script runs full path (reading -> trigger -> payout -> rejected replay) against a local node; then verified on testnet.

## 10. Submission plan
- New public GitHub repo (fresh history; original repo untouched).
- Vercel deployment of the dashboard.
- Video (3–5 min): 30s problem (reuse Act 1–2 b-roll) / 60s architecture / ~2 min live demo incl. rejected replay / 30s backtest + scaling story.
- Devpost description structured by the five judging criteria.

## 11. Out of scope (YAGNI)
- Mainnet, real money, KYC.
- Chainlink production integration (documented as production path only).
- Multi-oracle quorum implementation (documented).
- Migration data (existing placeholder file — unused).
- Accounts/auth/roles UI beyond what the demo needs.

## 12. Deliverables checklist
- [ ] Contracts + tests passing on Hardhat; deployed to testnet
- [ ] AI engine: forecast + risk + backtest outputs committed as JSON
- [ ] Keeper demo scenario (El Niño replay) with one-command run
- [ ] Dashboard Act 3 integrated with contracts via ethers.js
- [ ] README with architecture + honesty table + run instructions
- [ ] Demo video + Devpost submission
