# HighTide Protocol — Demo Video Script (target 4:00, limit 3:00–5:00)

> UPDATED 2026-09-05 to match the implemented system exactly. All commands,
> numbers and panels below are REAL and verified (ALL_GREEN gate). Narration
> in English. Record AFTER the Base Sepolia deploy so Scenes 3a-3c show
> BaseScan links; if recording before testnet deploy, use the local demo and
> say "local test node" instead of "Base Sepolia".

## Pre-record checklist

- [ ] Base Sepolia deployed (`contracts/.env` with DEPLOYER_PK + ORACLE_ADDRESS; `npm run deploy:base`) AND demo executed once on testnet (`demo:fund`, `demo:lanina`, `demo:attack` with ORACLE_PK)
- [ ] Otherwise: local demo ready — 2 terminals open in `contracts/`: one running `npm run demo:node`, deployments fresh (`demo:deploy` done)
- [ ] Site dev server (or Vercel URL) open at the Hero, browser zoom ~125%, clean profile
- [ ] Terminal font size enlarged (14pt+); `contracts/` directory shown in prompt
- [ ] BaseScan tabs pre-opened: pool contract page + tx list
- [ ] Mic test; 1440p; 30fps

## Numbers you must say correctly (verified)

- Tuvalu trigger years 2018, 2020, 2021, 2022 (tier 100% / 100% / 60% / 100%)
- TV 2022 reading 1.4678, expected 0.7472, z = 3.00, tier 100%, payout exactly **$1,414,480**
- La Nina replay (2020-2022): total **3,677,648 HTD** (1,414,480 + 848,688 + 1,414,480)
- Backtest 2015-2025: **13 payouts, 9 in ENSO window, $14,717,608** total at $10M/event reference pool
- On-chain == Python backtest, exact to the wei (the equivalence test)
- Always say "test tokens" / "public testnet" when money appears

---

## ACT 1 — The Problem (0:00-0:35)

**Screen:** Dashboard Acts 1-2 (existing scrollytelling). Slow scroll: emissions gap → sea level → the "Tides of Debt" narrative.

**Narration (EN):**

> "Pacific Island nations contributed almost nothing to climate change.
> Tuvalu emits around one ton of CO2 per person per year. The largest
> emitters: more than fourteen. Yet when sea levels rise, Tuvalu pays.
>
> The UN Loss and Damage Fund exists to rebalance this debt - but today
> it is slow, opaque, and every payout is negotiated by hand. What if
> compensation flowed automatically the moment verified data confirms an
> extreme sea-level event - with no committee, no double-dipping, and
> every dollar traceable on a public chain?"

**On-screen action:** end the act hovering 2s on a chart's citation chips ("every claim on this site cites a verified source").

---

## ACT 2 — What HighTide Is (0:35-1:20)

**Screen:** scroll into "Act 3 - The Protocol": ProtocolIntro's three cards (Verified data / AI risk engine / Smart contracts), then the TriggerExplainer card.

**Narration (EN):**

> "HighTide is a parametric Loss and Damage protocol built on three
> layers.
>
> Layer one, verified data: sea-level series from the Pacific Data Hub
> for thirteen nations - every dataset hash-anchored on-chain, so no
> number can quietly change.
>
> Layer two, an AI engine: it forecasts sea level with honest
> uncertainty, scores each country's risk, and sets trend-adjusted
> trigger thresholds. This is ENSO physics done right - in the western
> Pacific, extreme highs arrive with La Nina. Our backtest, replaying
> 2015 to 2025, fires thirteen times - including every documented La
> Nina surge.
>
> Layer three, smart contracts: when a signed oracle reading crosses a
> threshold, the contract pays the affected country automatically. Same
> event, one payout. Forever."

**On-screen action:** point at the formula card while saying "trend-adjusted"; the worked Tuvalu example highlights: reading 1.4678, expected 0.7472, z equals three sigma, payout one point four one million.

---

## ACT 3 — Live Demo (1:20-3:20)

### Scene 3a — Fund the pool (1:20-1:45)

**Screen:** split view - terminal (contracts/) left, terminal output right.

**Type & narrate (EN):**

> "Let's run it live. First, donors fund the pool - contribution weights
> come from AI risk scores. This is the carbon debt, made payable."

```bash
npm run demo:fund
```

Expected output: `Funded pool with 10,000,000 HTD` / `Pool balance: 10000000.0 HTD`.
(On testnet: switch to the BaseScan tab for 2-3s showing the fund tx.)

### Scene 3b — The trigger fires (1:45-2:35)

**Screen:** terminal, full width.

**Type & narrate (EN):**

> "Now we replay a real event: Tuvalu's documented La Nina sea-level
> surge. The keeper replays the actual historical readings - each one
> signed with the oracle key, each verified on-chain."

```bash
npm run demo:lanina
```

Expected output (let it roll on screen):

```
TRIGGERED 0x5456 2020-2020 peakZ=3.055743 tier=1
PAID 1414480.0 HTD to 0x8eD0... (outstanding 0.0)
TRIGGERED 0x5456 2021-2021 peakZ=2.838814 tier=0.6
PAID 848688.0 HTD ...
TRIGGERED 0x5456 2022-2022 peakZ=3.004657 tier=1
PAID 1414480.0 HTD ...
Tuvalu beneficiary balance: 3677648.0 HTD
```

> "Three triggers - the math matches the published backtest to the cent.
> One point four million, eight hundred forty-nine thousand, one point
> four million again... paid to Tuvalu's wallet in single transactions.
> No committee. No paperwork."

(On testnet: cut to BaseScan showing the three PayoutExecuted transactions.)

### Scene 3c — The double-count attack (2:35-3:00)

**Type & narrate (EN):**

> "Now the attack every climate fund fears: submit the same event twice."

```bash
npm run demo:attack
```

Expected: `ATTACK BLOCKED: contract reverted with ReadingAlreadyEvaluated`

> "Rejected - on-chain, permanently. This is what 'smart contracts
> prevent double counting' actually means."

### Scene 3d — The live dashboard (3:00-3:20)

**Screen:** browser, the LiveProtocol panel (fresh/refresh).

**Narration (EN):**

> "The dashboard reads the chain directly: pool balance, every payout,
> its transaction. Every panel cites its scientific sources - from IPCC
> AR6 to peer-reviewed ENSO research. Nothing here is a black box."

**On-screen action:** click one payout's explorer link; hover 2 citation chips.

---

## ACT 4 — Impact & Scale (3:20-4:00)

**Screen:** BacktestTimeline chart, then closing slide (logo + repo URL + prototype URL).

**Narration (EN):**

> "If HighTide had existed since 2015, it would have paid fourteen point
> seven million dollars across thirteen verified extreme sea-level
> events - automatically, transparently, with zero double payments. On
> chain and off chain, the numbers agree to the last cent.
>
> The Loss and Damage Fund holds pledges of seven hundred million
> dollars and no trusted disbursement rail. HighTide is that rail - and
> the same pattern extends to droughts, heatwaves, and floods wherever
> trusted data exists.
>
> The countries that emitted the least are already paying the most.
> Time the debt paid itself. HighTide Protocol."

**End frame (3s):** logo + GitHub URL + prototype URL + team name.

---

## Recording tips

- Practice the two npm commands once before recording; typing should look calm (pause narration while typing if needed)
- If a take fails mid-way, re-run `demo:node` + `demo:deploy` to reset the chain state (fresh 3-trigger run); on testnet you cannot reset - do the testnet takes LAST after rehearsing locally
- Total runtime discipline: Acts 1-2 under 80s combined; the demo is the heart - do not rush Scenes 3b/3c
- Captions: add the key numbers ($1,414,480 / 3,677,648 HTD / ATTACK BLOCKED) as text overlays in editing
