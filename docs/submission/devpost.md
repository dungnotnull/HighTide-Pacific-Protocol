# Devpost description (draft)

- Prototype URL: [PROTOTYPE URL]
- Repo URL: [REPO URL]

## Track

**Track 1 — Carbon Markets & Emissions Transparency.**

HighTide is an emissions-responsibility ledger: fund contribution weights are derived from real historical per-capita GHG data, making the carbon debt of major emitters the literal funding source of the pool. And the track's "smart contracts to prevent double counting" requirement is implemented literally — each trigger event can be paid exactly once, and any replay attempt is rejected on-chain.

## Problem

Pacific Island Countries emit the least and lose the most: rising seas threaten their land, water security, and sanitation (WASH) this century. The UN Loss and Damage Fund — around $700M pledged under UNFCCC — disburses slowly, opaquely, and through hand-negotiated allocation, while the communities that need it wait.

## Solution

HighTide Protocol is an AI-forecasted, blockchain-triggered Loss & Damage fund that pays Pacific Island countries automatically when verified sea-level data crosses scientific thresholds.

- **AI Engine (Python & Gemini):** Python statistical forecasting up to 2030 and risk scoring on real Pacific Data Hub sea-level series set the per-country thresholds and pool allocation weights. Meanwhile, Google Gemini 3.5 Flash is integrated directly into the application to dynamically generate data-driven WASH recovery strategies based on the parametric Carbon Debt payouts.
- **Smart contracts (Solidity):** the pool verifies EIP-712-signed oracle readings, evaluates trend-adjusted thresholds, pays tiered amounts, and enforces one payout per event.
- **Dashboard (Next.js):** an Earth/Forest-themed scrollytelling site that walks judges from the emissions cause to WASH damages, and finally to the live on-chain protocol, with every number traced to its source.

## How we built it

We designed the trigger statistic on a dual-series basis: a 30-year official trend series for the long-term rise, and a 2005-2025 satellite anomaly series for acute events — because ENSO phase contaminates short-window trends. Triggers validate against documented ENSO physics: 9 of our 13 backtest events land in the 2020-2022 La Nina window of observed western-Pacific sea-level highs [WIDLANSKY-2014]. The backtest over 2015-2025, calibrated on 2005-2014, produced $14.7M in hypothetical payouts at a $10M/event reference pool. 

The AI model further generates 2030 forecasts to predict future risks, which are fed into a live Google Gemini 3.5 Flash integration to propose regional and nation-specific WASH resilience strategies with scientific citations. The on-chain replay of the same historical readings reproduces the Python backtest exactly. We achieved a 100% pass rate across 20 rigorous Hardhat smart contract tests and 22 Python tests. Every dashboard panel renders citation chips resolving to our verified references.

## Impact

The Loss and Damage Fund's ~$700M in pledges currently lack trusted, automatic disbursement rails. HighTide demonstrates such rails end to end: a backtested parametric trigger, provenance-anchored data, and payouts that execute in seconds instead of months — with $14.7M in hypothetical payouts across 13 real historical events. The same architecture extends to cyclones, drought, and other parametric perils for any under-served region.

## Mock vs real

Real: Pacific Data Hub climate data; AI forecasts derived from it; contracts on a public testnet; EIP-712 signature verification, anti-replay and on-chain provenance. Mock (disclosed): fund currency is a test token; the oracle is our keeper replaying recorded history with time acceleration; a single oracle rather than a multi-oracle quorum (production path documented).

## What's next

Ethereum Sepolia deployment, a public repo and Vercel prototype, and a recorded demo running locally for maximum speed:
1. `npm run demo:deploy` to put contracts on-chain
2. `npm run demo:fund` to fund the pool
3. `npm run demo:lanina` to replay real La Nina readings and watch Tuvalu get paid instantly
4. `npm run demo:attack` to watch the contract detect and block a replay attack.
