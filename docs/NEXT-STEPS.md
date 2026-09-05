# NEXT STEPS — Handoff (updated 2026-09-05, ALL_GREEN state)

Project: **HighTide Protocol** — IEEE ClimateChain Hackathon 2026, Track 1.
Branch: `feat/ai-engine` (all work; main has baseline only). Deadline: ~early October 2026.

Everything autonomous is DONE and verified: AI engine (22 tests), contracts
(20 tests, on-chain == Python backtest to the wei), keeper demo (fund /
lanina / attack), dashboard Act 3, README, Devpost draft, demo video script.

## REMAINING — 4 steps, all blocked on user accounts

### Step 1 — Base Sepolia deployment (do FIRST; ~15 min)

Needs from user:
- A testnet wallet with Base Sepolia ETH (faucet: alchemy.com/faucets/base-sepolia
  or Base Discord faucet)
- A second throwaway address to act as the oracle (any address the user controls)

Then:
1. Put in `contracts/.env` (gitignored — never commit):
   ```
   DEPLOYER_PK=0x...        (funded deployer key)
   ORACLE_ADDRESS=0x...     (second address — REQUIRED on testnet, deployer-only signers)
   ORACLE_PK=0x...          (private key of that second address, for the keeper)
   ```
2. Deploy: `cd contracts && npm run deploy:base` → writes `deployments-baseSepolia.json`
3. Copy it to `data/deployments-baseSepolia.json` and commit (addresses + ABIs only, no keys)
4. Keeper testnet signing: NOT YET IMPLEMENTED — small task: extend
   `contracts/scripts/keeper.ts` to use `new ethers.Wallet(process.env.ORACLE_PK, provider)`
   as the oracle signer when network != localhost (currently uses signers[1], which
   only works on local). Add testnet demo scripts or document env-based flow.
5. Run demo on testnet for video footage: demo:fund → demo:lanina → demo:attack
   (payouts visible on BaseScan — this is the video's strongest footage)
6. Verify the site LiveProtocol panel flips to testnet state (loader prefers
   baseSepolia when pool address starts with 0x)

### Step 2 — Public GitHub repo (~15 min)

User creates repo (suggested name `hightide-protocol`), then push. Ask user
whether to merge `feat/ai-engine` into `main` first or push both branches.
Repo must be PUBLIC (hackathon requirement). Double-check no secrets ever
committed: `git ls-files | grep -iE "wallets|private"` must stay empty.

### Step 3 — Vercel (~10 min)

User imports the repo on Vercel (framework Next.js, root `/`, no env vars
needed — static + public RPC). Fill the URL into:
- `docs/submission/devpost.md` ([PROTOTYPE URL] placeholder)
- `README.md` if a URL slot exists

### Step 4 — Record the video + submit

Follow `docs/submission/demo-video-script.md` (updated to match the real
system: commands, outputs, 3,677,648 HTD, panels). Rehearse locally first,
record testnet takes last. Then submit on Devpost using devpost.md.
Recheck before submitting: NOAA citation [NOAA-SLT] URL retires after
2026-09-30 — verify it still resolves, replace if dead.

## Where everything lives

- Spec: `docs/superpowers/specs/2026-09-05-hightide-protocol-design.md`
- Plans 1-4 (all complete, checkboxed): `docs/superpowers/plans/`
- Verified bibliography (27 sources): `docs/research/REFERENCES.md`
- Devpost draft: `docs/submission/devpost.md`
- Video script: `docs/submission/demo-video-script.md`
- Local demo: `contracts/README.md` (demo:node → demo:deploy → demo:fund → demo:lanina → demo:attack)
- Verified numbers: k=2.0 sigma, N=1; 13 backtest events; $14,717,608 total;
  TV replay payout 3,677,648 HTD; on-chain == Python backtest exact wei

## Tomorrow's kickoff prompt (paste to Claude)

"Continue HighTide from docs/NEXT-STEPS.md — Step 1: Base Sepolia deployment.
Here is my DEPLOYER_PK / ORACLE setup." (Claude's memory also has this context.)
