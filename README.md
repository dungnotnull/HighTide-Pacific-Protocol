# HighTide Protocol

**An AI-forecasted, blockchain-triggered Loss & Damage fund for Pacific Island Countries.**

Entry for the **IEEE ClimateChain Global Hackathon 2026 — Track 1: Carbon Markets & Emissions Transparency**.

Pacific Island Countries emit the least and lose the most. HighTide turns that story into a mechanism: a parametric fund whose payout thresholds are forecasted up to 2030 and calibrated by an AI engine on real sea-level data, and whose disbursements execute automatically on a public blockchain — repaying the historical carbon debt for WASH (Water, Sanitation, and Hygiene) damages. Each trigger is paid exactly once, immune to double-counting.

## How it works

Three layers, each independently tested:

```
  AI ENGINE (Python)            SMART CONTRACTS (Solidity / Hardhat)
  forecast + risk weights  -->  ClimateDataRegistry (data-hash provenance)
  trend-adjusted thresholds     HighTidePool (custody + parametric trigger,
  backtest 2015-2025            EIP-712 oracle verification, anti-replay)
        |                              ^
        v                              |
  KEEPER / ORACLE (TypeScript) -- signed readings on Ethereum Sepolia testnet
                                       |
                                       v
  DASHBOARD (Next.js scrollytelling) -- Acts 1-2: the cause and the reality
                          Act 3: The Protocol (risk table, backtest timeline,
                          trigger explainer, LIVE on-chain payout panel,
                          and Gemini 3.5 Flash AI Strategy generator)
```

1. **AI engine** (`ai-engine/`, Python): per-country sea-level trend + forecast with prediction intervals up to 2030, blended chronic/acute risk scores that set pool allocation weights, and a 2015-2025 backtest of the trigger rule against real Pacific Data Hub data.
2. **Smart contracts** (`contracts/`, Solidity): an ERC20 fund token, a data-hash registry for provenance, and a combined pool contract that verifies EIP-712-signed oracle readings, evaluates the trigger state machine, pays tiered amounts, and enforces one payout per event.
3. **Dashboard** (this Next.js app): a scrollytelling experience in an Earth/Forest theme highlighting the link between Carbon Debt and WASH damage. Features Act 3 "The Protocol" — risk allocation table, backtest payout timeline, 2030 AI forecast visualization, a live panel reading the deployed pool state, and a **Gemini 3.5 Flash AI Strategy** integration for dynamic WASH recovery recommendations.

## Judging criteria mapping

| Criterion | How HighTide scores |
|---|---|
| Climate Impact | Direct disbursement mechanism for UN Loss & Damage — a real COP31 pain point (slow, opaque, contested allocation) |
| Innovation & Creativity | Climate-justice fintech: historical emissions responsibility becomes automated repayment; distinct from carbon-credit clones |
| Technical Execution | Three real layers: statistical AI on real data + EIP-712 signed oracle verification on-chain + parametric contracts with anti-replay |
| Practical Usefulness | The Loss & Damage Fund (pledged ~$700M under UNFCCC) lacks trusted disbursement rails; the backtest proves workable thresholds |
| Presentation | Scrollytelling dashboard with live on-chain state; demo replays real La Nina readings, pays out, then shows a replay rejected on-chain |

## Results

All numbers below come from committed pipeline output (`data/protocol/backtest_report.json`), not hand-written claims.

- Trigger rule: threshold = trend(year) + **k = 2.0 sigma**, **N = 1** consecutive reading(s); tiers 30% / 60% / 100% by anomaly magnitude.
- Backtest over **2015-2025** (calibration on 2005-2014) fired on **13 country-year events**, of which **9 fall in the 2020-2022 La Nina window** — consistent with the documented ENSO physics for the western tropical Pacific (highs during La Nina, drops during El Nino).
- Hypothetical payouts at the **$10M/event reference pool** total **$14,717,608** across the 13 events (Cook Islands, Tuvalu, Vanuatu, Samoa).
- The on-chain replay of the same historical readings reproduces the Python backtest exactly — covered by Hardhat tests including a real-data equivalence check and an end-to-end fund/replay/attack scenario.
- Test coverage: **20 Hardhat tests** (contracts) and **22 Python tests** (AI engine). All 100% passing.

## Quickstart

AI engine (Python 3.11+):

```bash
cd ai-engine
pip install -r requirements.txt
pytest                 # 22 tests
python scripts/run_all.py   # forecast + risk + backtest -> ../data/protocol/*.json
```

Smart contracts (Node 18+):

```bash
cd contracts
npm install
npx hardhat test       # 20 tests
npm run demo:node      # terminal 1: local chain
npm run demo:deploy    # terminal 2: deploy + configure 13 countries + anchor hashes
npm run demo:fund      # donor funds the pool (10,000,000 HTD)
npm run demo:lanina    # replay Tuvalu 2020-2022 (real La Nina readings) -> automatic payouts
npm run demo:attack    # resubmit 2022 -> rejected on-chain (contract detects ReadingAlreadyEvaluated)
```

Dashboard (Next.js):

```bash
# Optional: To use the AI Strategy generator, add your Gemini API Key to a .env file
# echo "GEMINI_API_KEY=your_key_here" > .env
npm install
npm run dev            # http://localhost:3000
```

## Mock vs real

We disclose exactly what is real and what is mocked. Nothing below is overstated.

| Real | Mock (disclosed) |
|---|---|
| Pacific Data Hub climate data | Fund currency = test tokens (ERC20) |
| AI forecasts and thresholds derived from that real data | Oracle = our keeper script replaying recorded history |
| Contracts deployed on a public testnet | Time acceleration for the demo |
| Signature verification, anti-replay, on-chain provenance | Single oracle (production path: multi-oracle quorum, documented) |

The Ethereum Sepolia deployment of the contracts is the final step in the submission; until then the contracts run and are fully tested on a local node, and the dashboard's live panel renders the local deployment state.

## Scientific grounding

Every pipeline output JSON carries citation IDs (e.g. `PDH-SEA`, `WIDLANSKY-2014`, `IPCC6-CH9`) that resolve in **`docs/research/REFERENCES.md`** — 27 sources, each verified for title, venue, and working URL. The dashboard renders these as clickable source chips on every protocol panel, so judges can trace each number to its origin.

## Repository layout

```
ai-engine/         Python: load, forecast, risk, backtest, citations (+ 22 tests)
contracts/         Solidity: token, registry, pool (+ 20 Hardhat tests, keeper demo scripts)
components/sections/protocol/   Dashboard Act 3: risk table, backtest timeline,
                                trigger explainer, live on-chain panel
data/protocol/     Committed pipeline outputs: trigger_params, risk_allocation,
                   forecasts, backtest_report (with citation IDs)
docs/              Design spec, plans, research references, submission drafts
```

## Next steps

- Deploy the contracts to **Ethereum Sepolia** (user-dependent: funded deployer key) and wire the dashboard's live panel to the testnet addresses.
- Publish the dashboard on **Vercel** and the repository publicly.
- Record the demo video per **`docs/submission/demo-video-script.md`**.
- Submit on Devpost (draft: **`docs/submission/devpost.md`**).
