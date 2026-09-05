# HighTide Protocol — Demo Video Script (target 4:00, limit 3:00–5:00)

> STATUS: Storyboard for the FINAL product. Record only after Plans 2–4 are
> complete (contracts on Base Sepolia, keeper E2E, dashboard Act 3 deployed).
> Narration is in English (international judges). Practice once; keep takes
> short; captions for key numbers.

## Pre-record checklist

- [ ] Vercel dashboard URL live and warm (open it once before recording)
- [ ] Testnet contracts deployed; wallet funded with test tokens
- [ ] BaseScan links open in separate tabs (pool contract, payout tx history)
- [ ] Keeper demo scenario tested end-to-end twice (La Nina replay works)
- [ ] Browser: clean profile, 1440p, zoom ~125%, hide bookmarks bar
- [ ] Terminal open in `keeper/` ready to run the demo command
- [ ] Mic test; room quiet; screen recorder at 30fps+

---

## ACT 1 — The Problem (0:00–0:35)

**Screen:** Dashboard Acts 1–2 (existing scrollytelling): Pacific map, CO2
responsibility gap, sea-level rise chart with Tuvalu highlighted.

**Narration (EN):**

> "Pacific Island nations contributed almost nothing to climate change —
> Tuvalu emits about one ton of CO2 per person per year. The United States:
> more than fourteen. Yet when sea levels rise, Tuvalu pays the price.
>
> The UN's Loss and Damage Fund was created to fix this — but today it is
> slow, opaque, and every payout is negotiated by hand. What if compensation
> could flow automatically, the moment verified data confirms an extreme
> sea-level event — with no one deciding, no one double-dipping, and every
> dollar traceable?"

**Action:** slow scroll through Cause → Reality acts; end hover on the
correlation chart (sea level vs water security) with its citation footer
visible for 2 seconds.

---

## ACT 2 — What HighTide Is (0:35–1:20)

**Screen:** Architecture diagram slide (make one clean slide; from spec
section 4). Three layers light up as you speak.

**Narration (EN):**

> "HighTide is a parametric Loss and Damage protocol built on three layers.
>
> Layer one: real climate data. Thirteen Pacific nations, from the Pacific
> Data Hub — every dataset hash-anchored on-chain so nobody can quietly
> change a number.
>
> Layer two: an AI engine. It forecasts sea level with statistical
> uncertainty, scores each country's risk, and sets trigger thresholds —
> calibrated on real ENSO physics: in the western Pacific, sea-level highs
> arrive with La Nina. Our backtest, replaying 2015 to 2025, shows the
> protocol would have paid out thirteen times — including every documented
> La Nina surge, with Tuvalu triggering in 2020, 2021 and 2022.
>
> Layer three: smart contracts. When a signed oracle reading crosses a
> threshold, the contract pays the affected country's wallet automatically —
> and the same event can never be paid twice."

**Action:** highlight each layer on the diagram; show backtest chart
(events by year, ENSO window shaded) for the last 15 seconds.

---

## ACT 3 — Live Demo (1:20–3:20)

### Scene 3a — Fund the pool (1:20–1:45)

**Screen:** Dashboard Act 3 — "The Protocol" view. Pool balance: 0.

**Narration (EN):**

> "Let's run it live. First, donors fund the pool. Contribution weights come
> from historical emissions responsibility — this is the carbon debt, made
> payable."

**Action:** click "Fund pool (demo)" — MetaMask prompt on Base Sepolia —
confirm. Pool balance updates to 10,000,000 HTD. Show the BaseScan tx link
briefly.

### Scene 3b — The trigger fires (1:45–2:35)

**Screen:** Terminal + dashboard side by side (or split screen).

**Narration (EN):**

> "Now we replay a real event: the 2022 La Nina sea-level surge. The oracle
> submits Tuvalu's verified readings — each one signed, each one checked
> against the anchored dataset hash on-chain."

**Action:** run `npm run demo:lanina-2022` in keeper terminal. Watch log
lines: `submitting reading 2022 ... z-score 3.00 ... TRIGGERED`. Dashboard
updates in real time: Tuvalu card flips to TRIGGERED, tier 100%.

> "Tuvalu's reading is three sigma above its calibrated trend. The contract
> verifies the oracle signature on-chain, evaluates the trigger — and pays.
> One point four million dollars to Tuvalu's wallet, in one transaction.
> No committee. No paperwork. Seven seconds."

**Action:** click the payout tx link → BaseScan shows the transfer; show
Tuvalu wallet balance increased.

### Scene 3c — Double-claim rejected (2:35–3:00)

**Screen:** Terminal again.

**Narration (EN):**

> "Now the attack every climate fund fears: submitting the same event twice.
> The contract recognizes the event ID — and rejects it. On-chain. Forever.
> This is what 'smart contracts prevent double counting' means in practice."

**Action:** run `npm run demo:replay-attack` → tx reverts with
`PayoutAlreadyExecuted` (show the revert reason in the log/terminal and on
BaseScan).

### Scene 3d — Everything is verifiable (3:00–3:20)

**Screen:** Dashboard scroll over Act 3: risk table, per-chart citation footers.

**Narration (EN):**

> "Every number on this dashboard is either computed on-chain or anchored to
> a hash — and every scientific choice cites a verifiable source, from IPCC
> AR6 to peer-reviewed ENSO research. Nothing here is a black box."

**Action:** hover over 2 citation footers; open docs/research/REFERENCES.md
briefly.

---

## ACT 4 — Impact & Scale (3:20–4:00)

**Screen:** Backtest summary + closing slide (logo, repo URL, dashboard URL).

**Narration (EN):**

> "If HighTide had existed since 2015, it would have paid fourteen point
> seven million dollars across thirteen verified extreme sea-level events —
> automatically, transparently, with zero double payments.
>
> The Loss and Damage Fund has pledges of seven hundred million dollars and
> no trusted disbursement rail. HighTide is that rail. The same pattern
> extends beyond the Pacific — to droughts, heatwaves, and flood parametric
> funds anywhere trusted data exists.
>
> The countries that emitted the least are already paying the most. It's
> time the debt paid itself. HighTide Protocol."

**Action:** end frame holds 3 seconds: logo + "github.com/<user>/hightide"
+ dashboard URL + team name.

---

## Numbers to say correctly (double-check before recording)

- Tuvalu ~1 t CO2/person/yr vs US ~14+ t (verify current figures from
  emitters_context.json / OWID before recording)
- Backtest: k=2.0 sigma, N=1 consecutive reading, 13 events 2015–2025,
  9 in ENSO window, USD 14,717,608 total, mock pool USD 10M per event
  reference
- Tuvalu trigger years: 2018, 2020, 2021, 2022
- Demo payout amount for TV 2022 (tier 100%): ~USD 1.41M — read the actual
  figure from the tx at recording time
- Always say "test tokens on a public testnet" when showing money

## Honesty rules (do not break on camera)

- Say "test tokens on Base Sepolia testnet" whenever funds appear
- Say "oracle replaying real historical data" — never imply live feeds
- The mock-vs-real table from the README goes into the Devpost description
