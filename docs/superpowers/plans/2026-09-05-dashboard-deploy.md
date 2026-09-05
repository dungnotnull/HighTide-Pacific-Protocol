# HighTide Dashboard + Deploy + Submission Plan (Plan 4 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Next.js scrollytelling site into the HighTide submission: a new Act 3 "The Protocol" section (risk allocation, backtest visualization, trigger explainer, LIVE on-chain panel), deploy contracts to Base Sepolia, publish the site on Vercel, create the public GitHub repo, and draft the Devpost description.

**Architecture:** The existing site keeps its scrollytelling Acts; Act 3 appends before the footer. Static content imports `data/protocol/*.json` (committed) exactly as existing charts import `@/data/*.json`. The live panel is a client component using ethers v6 reading a committed `data/deployments-baseSepolia.json` (addresses + ABIs only — no secrets; generated in Task 6). Every panel renders its citation chips via a shared `Cite` component backed by `lib/citations.ts` (the machine-readable map of `docs/research/REFERENCES.md`).

**Tech Stack:** Next.js (existing app), react-plotly.js (existing), ethers v6 (new frontend dep), Vercel, Base Sepolia.

**USER-DEPENDENT steps (flagged):** Task 6 needs a funded Base Sepolia deployer key (faucet); Task 7 needs the user's GitHub + Vercel accounts. Everything else is autonomous.

---

### Task 1: Citations map + Cite component

**Files:**
- Create: `lib/citations.ts`
- Create: `components/ui/Cite.tsx`

- [ ] **Step 1: Write the citations map**

`lib/citations.ts` — entries: `[id]: { title, source, year, url }` transcribed EXACTLY from `docs/research/REFERENCES.md` (25 entries: PDH-SEA, NOAA-SLT, PSMSL, NASA-SL, WB-CCKP, IPCC6-CH9, MERRIFIELD-2011, WIDLANSKY-2014, WIDLANSKY-2015, WERNER-2017, BAILEY-2014, PCRAFI, PCRIC, ARC, UNFCCC-FRLD, COP28-1CP28, SNLD, FPP3, STATSMOLS, NIST-PI, EIP-712, CHAINLINK, GOFFARD-2025, CONDON-2017, OWID-CO2, OWID-CO2-COUNTRY, GCB — transcribe each entry's title/publisher/year/URL from the REFERENCES.md lines; CONDON-2017 authors are Cohn, West, Parker). Export `CITATIONS` and a type `CitationId = keyof typeof CITATIONS`.

- [ ] **Step 2: Write the Cite component**

`components/ui/Cite.tsx` (server component; follow the site's existing styling conventions — check `app/globals.css` tokens: `ink`, `foam`, `ocean-deep`; fonts: fraunces/public-sans/ibm-plex-mono):

```tsx
import { CITATIONS } from "@/lib/citations";

export function Cite({ ids }: { ids: string[] }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-foam/50">
      <span>Sources:</span>
      {ids.map((id) => {
        const c = (CITATIONS as Record<string, { title: string; url: string }>)[id];
        if (!c) return null;
        return (
          <a
            key={id}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            title={c.title}
            className="rounded-full border border-foam/20 px-2 py-0.5 text-foam/70 transition-colors hover:border-foam/50 hover:text-foam"
          >
            {id}
          </a>
        );
      })}
    </p>
  );
}
```

- [ ] **Step 3: Verify**

Run: `cd D:/IEEEClimateChainGlobal2 && npm run build`
Expected: build succeeds (typecheck passes).

- [ ] **Step 4: Commit**

```bash
git add lib/citations.ts components/ui/Cite.tsx
git commit -m "feat(ui): machine-readable citations map and source-chip component"
```

---

### Task 2: Risk allocation table + backtest timeline (static panels)

**Files:**
- Create: `components/sections/protocol/RiskAllocation.tsx`
- Create: `components/sections/protocol/BacktestTimeline.tsx`

- [ ] **Step 1: Risk allocation table**

`components/sections/protocol/RiskAllocation.tsx` — server component; imports `@/data/protocol/risk_allocation.json`; renders a responsive table of the 13 countries sorted by allocation_weight desc: name, trend (mm/yr, 1dp), acute exceedance probability (%, 0dp), risk index (bar), allocation weight (% of pool, 2dp, with a subtle horizontal bar using the site's accent). Footer: `<Cite ids={["WB-CCKP", "WIDLANSKY-2015", "OWID-CO2", "GCB", "PCRIC"]} />`. Also render the `method` string from the JSON as a caption. BEFORE WRITING, read `components/sections/EmittersContrastBar.tsx` to copy the site's table/bar styling conventions (classes, spacing, heading hierarchy) — match them exactly.

- [ ] **Step 2: Backtest timeline chart**

`components/sections/protocol/BacktestTimeline.tsx` — client component ("use client"); imports `@/data/protocol/backtest_report.json`; one react-plotly bar chart (read an existing chart first — e.g. `components/charts/SeaLevelScrolly.tsx` — for the established Plot import/config pattern): x = event end years (all 13 events), y = payout_usd / 1e6, hover = country/peak_z/tier; a shaded ENSO band (2020–2022) annotated "La Nina highs"; title stat line above the chart: "13 payouts · 9 in ENSO window · $14.7M total (mock pool $10M/event)". Caption explains k=2.0σ, N=1, calibration 2005–2014, evaluation 2015–2025. Footer cites `["IPCC6-CH9", "WIDLANSKY-2014", "PCRAFI", "ARC", "PDH-SEA"]`.

- [ ] **Step 3: Verify + commit**

Run: `npm run build` — clean. Then:

```bash
git add components/sections/protocol
git commit -m "feat(ui): risk allocation table and backtest payout timeline"
```

---

### Task 3: Trigger explainer + Protocol intro section

**Files:**
- Create: `components/sections/protocol/TriggerExplainer.tsx`
- Create: `components/sections/protocol/ProtocolIntro.tsx`

- [ ] **Step 1: Protocol intro**

`components/sections/protocol/ProtocolIntro.tsx` — server component; 3-column "How HighTide works" card row (1: Verified data — PDH series, hashes anchored on-chain; 2: AI risk engine — forecasts, risk weights, thresholds; 3: Smart contracts — EIP-712 oracle readings, automatic payout, double-count impossible). Uses the site's card/heading conventions. Cites `["PDH-SEA", "EIP-712", "GOFFARD-2025", "UNFCCC-FRLD"]`.

- [ ] **Step 2: Trigger explainer**

`components/sections/protocol/TriggerExplainer.tsx` — server component; the formula card:

> threshold(year) = intercept + slope·year + k·σ, trigger when z ≥ k for N consecutive readings; payout tiers: z≥3σ → 100% · z≥2σ → 60% · z≥1σ → 30% of the country's allocation

with the worked Tuvalu example as a mono-font block (real numbers from `trigger_params.json`: intercept −23.7716, slope 0.0121, σ 0.2398, k=2, N=1; 2022 reading 1.4678 → expected 0.7427 → z = 3.00 → tier 100% → payout $1,414,480). Cites `["IPCC6-CH9", "MERRIFIELD-2011", "WIDLANSKY-2014", "NIST-PI", "FPP3"]`.

- [ ] **Step 3: Verify + commit**

`npm run build` clean; then:

```bash
git add components/sections/protocol
git commit -m "feat(ui): protocol intro cards and trigger explainer with worked example"
```

---

### Task 4: LIVE on-chain panel

**Files:**
- Create: `components/sections/protocol/LiveProtocol.tsx`
- Create: `lib/deployments.ts`
- Modify: `package.json` (add `ethers` ^6)
- Create (generated, committed): `data/deployments-baseSepolia.json` (Task 6 produces it; until then the panel renders a graceful "not deployed" state using the localhost file if present)

- [ ] **Step 1: Install ethers in the frontend**

Run: `npm install ethers@^6`

- [ ] **Step 2: Deployments loader**

`lib/deployments.ts`:

```typescript
import baseSepolia from "@/data/deployments-baseSepolia.json";
import localhost from "@/data/deployments-localhost.json";

export type Deployments = {
  network: string;
  chainId?: number;
  token: string;
  registry: string;
  pool: string;
  oracle: string;
  beneficiaries: Record<string, string>;
  abi: { pool: string; registry: string; token: string };
};

const SEPOLIA = baseSepolia as unknown as Deployments;
const LOCAL = localhost as unknown as Deployments;

export function getDeployments(): Deployments {
  // Testnet first; fall back to the local demo deployment
  if (SEPOLIA?.pool?.startsWith("0x")) return SEPOLIA;
  return LOCAL;
}

export const EXPLORER: Record<string, string | null> = {
  baseSepolia: "https://sepolia.basescan.org",
  localhost: null,
};
```

Also copy `contracts/deployments-localhost.json` to `data/deployments-localhost.json` (committed) so the panel works before testnet deploy. For `data/deployments-baseSepolia.json` create a placeholder `{"network":"baseSepolia","pool":"","token":"","registry":"","oracle":"","beneficiaries":{},"abi":{"pool":"[]","registry":"[]","token":"[]"}}` — Task 6 overwrites it (loader's startsWith("0x") check handles the empty case).

- [ ] **Step 3: Live panel**

`components/sections/protocol/LiveProtocol.tsx` — "use client"; ethers `BrowserProvider`? No — the panel only READS: use `new ethers.JsonRpcProvider("https://sepolia.base.org")` for testnet (public RPC read-only; no wallet connect needed — keep the demo simple) or `http://127.0.0.1:8545` when deployments.network === "localhost". Contract instances from the ABIs. Display:
  - network badge ("Base Sepolia testnet" / "Local node") + pool/token links to the explorer (BaseScan) when available
  - Pool balance (HTD, from token.balanceOf(pool))
  - Total paid across countries (sum of Triggered→PayoutExecuted via `pool.queryFilter(pool.filters.PayoutExecuted())`, sum `paid` args)
  - Recent payouts list (last 8): country code (beneficiaries map reverse lookup), amount, tx hash linked to explorer, block age
  - Refresh button + auto-refresh every 30s; loading and error states ("Contracts not deployed to this network yet")
  - Disclosure line: "Test tokens on a public testnet. Oracle replays real historical readings." Cites `["EIP-712", "CHAINLINK", "GOFFARD-2025", "CONDON-2017"]`.

Implementation notes: wrap chain reads in try/catch per-field so one failing RPC does not blank the panel; format amounts with `ethers.formatEther` trimmed to 2dp; the 30s interval must clean up on unmount.

- [ ] **Step 4: Verify + commit**

`npm run build` clean; `npm run dev` and check the panel renders the local-deployment state (start `contracts` demo node + deploy first, or verify the graceful fallback state). Then:

```bash
git add components/sections/protocol/LiveProtocol.tsx lib/deployments.ts data/deployments-localhost.json data/deployments-baseSepolia.json package.json package-lock.json
git commit -m "feat(ui): live on-chain panel reading pool payouts from the deployed network"
```

---

### Task 5: Integrate Act 3 into the page

**Files:**
- Modify: `app/page.tsx`
- Create: `components/sections/protocol/ProtocolSection.tsx`

- [ ] **Step 1: Section wrapper**

`components/sections/protocol/ProtocolSection.tsx` — server component assembling ProtocolIntro, TriggerExplainer, RiskAllocation, BacktestTimeline, LiveProtocol under one Act-3 heading ("Act 3 — The Protocol: the carbon debt, repaid automatically") following the existing section heading conventions (read `components/sections/Cause.tsx`).

- [ ] **Step 2: Wire into the page**

In `app/page.tsx`: import ProtocolSection; render after `<Part2Chart2V2 />` and before the footer; add a TideRail mark `{ id: "protocol", label: "the protocol" }`.

- [ ] **Step 3: Verify + commit**

`npm run build` clean; `npm run dev` — scroll the full page: all existing sections render unchanged, Act 3 renders after the sea-status chart. Commit:

```bash
git add app/page.tsx components/sections/protocol/ProtocolSection.tsx
git commit -m "feat(ui): integrate Protocol act into the scrollytelling page"
```

---

### Task 6: Base Sepolia deployment (USER-DEPENDENT)

**Files:**
- Generated (committed): `contracts/deployments-baseSepolia.json` + `data/deployments-baseSepolia.json` (same content)

- [ ] **Step 1 (USER): provide a funded deployer key**

The user creates/imports a wallet, gets Base Sepolia ETH from a faucet (e.g. https://www.alchemy.com/faucets/base-sepolia or the Base discord faucet), and puts in `contracts/.env` (gitignored):

```
DEPLOYER_PK=0x...
ORACLE_ADDRESS=0x...   # optional; default = second account derived from DEPLOYER_PK? NO - deploy script uses signers[1] which is DEPLOYER_PK only on testnet, so the user must provide a second key OR set ORACLE_ADDRESS to any address they control
```

NOTE for implementer: on testnet `ethers.getSigners()` returns ONLY the deployer, so `signers[1]` crashes — the deploy script already prefers `ORACLE_ADDRESS` env; the user MUST set it (a second throwaway key they control; the keeper needs its private key locally to sign readings). Document this in contracts/README (Plan 4 Task 8).

- [ ] **Step 2: Deploy**

Run: `cd contracts && npm run deploy:base`
Expected: full deploy output; writes `deployments-baseSepolia.json`. Copy it to `data/deployments-baseSepolia.json` too.

- [ ] **Step 3: Fund + demo on testnet (oracle keeper needs the second key)**

For the video: extend keeper minimally — `ORACLE_PK` env (in contracts/.env) used as `new ethers.Wallet(ORACLE_PK, provider)` when network != localhost, replacing signers[1]. Then run demo:fund/lanina/attack against baseSepolia (add package scripts demo:base:fund etc. or document the env-based flow). Payouts visible on BaseScan — this is the footage for the video.

- [ ] **Step 4: Verify + commit**

Verify `data/deployments-baseSepolia.json` has real addresses; the LiveProtocol panel (dev server) now shows the testnet state after running demo:fund/lanina once. Commit both deployment files:

```bash
git add data/deployments-baseSepolia.json
git commit -m "feat(deploy): Base Sepolia deployment addresses and ABIs for the live panel"
```

(contracts/deployments-baseSepolia.json stays gitignored; the data/ copy is the committed one.)

---

### Task 7: Root README overhaul + submission docs

**Files:**
- Modify: `README.md` (root — replace the old project README with the HighTide one)
- Create: `docs/submission/devpost.md`

- [ ] **Step 1: Root README**

Sections: one-liner + how it works (3 layers, diagram in ASCII); the 5-judging-criteria mapping table; quickstart (ai-engine run, contracts test + demo, site dev); architecture links (specs/plans); **mock-vs-real honesty table** (from spec section 7); citations statement pointing to docs/research/REFERENCES.md; repo layout. Transcribe honestly from what exists — no future tense for unbuilt things.

- [ ] **Step 2: Devpost description draft**

`docs/submission/devpost.md` structured by: Track (1 + why), Problem, Solution, How we built it (AI engine + contracts + keeper + dashboard, each with the scientific grounding sentence and citations), Impact/scale (L&D fund $700M pledges; backtest $14.7M/13 events), Mock-vs-real disclosure, Team. ~500 words, English, no emojis.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/submission/devpost.md
git commit -m "docs: submission-grade README and Devpost description draft"
```

---

### Task 8: Vercel deploy + public GitHub repo (USER-DEPENDENT)

- [ ] **Step 1 (USER): create the public GitHub repo** — e.g. `hightide-protocol`. Push BOTH main and feat/ai-engine (or merge first — user decision; ask).
- [ ] **Step 2 (USER): Vercel** — import the repo, framework Next.js, root directory `/` (site), deploy; set no env vars needed (static + public RPC). Record the URL.
- [ ] **Step 3: Post-deploy checks** — the site loads; Act 3 renders; LiveProtocol shows testnet data; explorer links work.
- [ ] **Step 4: Record URLs** in `docs/submission/devpost.md` (prototype URL + repo URL placeholders filled).

---

## Completion criteria for Plan 4

- [ ] `npm run build` clean; Act 3 renders in dev with all five panels
- [ ] Every panel carries citation chips resolving to real sources
- [ ] LiveProtocol reads real on-chain state from Base Sepolia (or local fallback) with graceful errors
- [ ] Base Sepolia deployment done; demo scenario executed on testnet at least once (fund + lanina + attack)
- [ ] Root README (honesty table) + Devpost draft complete
- [ ] Public GitHub repo + Vercel URL recorded
- [ ] Video recorded per docs/submission/demo-video-script.md (user executes; Claude assists)

## Final gate (all 4 plans)

Run everything: ai-engine 22 tests, contracts 20 tests + one-command demo, site build + Act 3. Then `superpowers:finishing-a-development-branch`.
