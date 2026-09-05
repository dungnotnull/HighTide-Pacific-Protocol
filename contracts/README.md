# HighTide Contracts

On-chain layer of the HighTide Protocol: parametric Loss & Damage payouts
triggered by signed sea-level readings.

## Contracts

- `MockFundToken` - ERC20 testnet stand-in for fund currency (public mint
  on purpose; no real value).
- `ClimateDataRegistry` - immutable hash anchoring of datasets and AI
  outputs, with provenance metadata.
- `HighTidePool` - custody + parametric engine: EIP-712 oracle
  verification, trend-adjusted triggers at 1e6 fixed point (mirrors
  `ai-engine/hightide/stats.py`), tiered payouts (z>=3: 100%, z>=2: 60%,
  z>=1: 30% of allocation), one evaluation per (country, year), one
  payout per event id, pro-rata when the pool runs short.

## Fixed-point conventions

Everything is scaled by 1e6, loaded from `data/protocol/*.json`:
intercept/slope/sigma are per-country scaled ints; z is returned scaled;
k and weights are scaled. See the plan's verification anchor for the
worked Tuvalu-2022 example (payout = exactly 1,414,480 HTD).

## Test

    cd contracts && npm install && npx hardhat test

19 tests (2 token + 3 registry + 5 pool configuration + 4 oracle
signature + 2 real-data equivalence + 3 payout), including a real-data
equivalence test replaying Tuvalu's 2005-2025 series on-chain and
matching the Python backtest event-for-event.

## Deploy (local)

    npx hardhat run scripts/deploy.ts --network hardhat

Writes `deployments-hardhat.json` (addresses, beneficiaries, ABIs) for the
keeper and dashboard. Base Sepolia: `npm run deploy:base` with
`DEPLOYER_PK` and optionally `ORACLE_ADDRESS` in `.env`.

## Honesty

Test tokens on a public testnet only. The oracle is a single registered
signer for the demo; the production path is a decentralized oracle
network (e.g. Chainlink) - see the project README's mock-vs-real table.
