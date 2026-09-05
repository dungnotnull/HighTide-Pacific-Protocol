# HighTide Smart Contracts Implementation Plan (Plan 2 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the on-chain layer of HighTide: a mock fund token, a data-integrity registry, and HighTidePool — the parametric payout contract that verifies EIP-712-signed oracle readings, evaluates trend-adjusted triggers with the same state machine as the Python engine, pays affected countries, and makes double-counting impossible.

**Architecture:** Three contracts in `contracts/` (Hardhat + OpenZeppelin 5 + ethers v6, Solidity 0.8.24). HighTidePool merges fund custody and parametric logic (single contract = fewer cross-contract calls for the demo). All numeric parameters load from Plan 1's committed JSON outputs at 1e6 fixed point — the contracts, the Python engine, and the backtest share one source of truth, and a real-data test asserts on-chain results equal the Python backtest exactly.

**Tech Stack:** Hardhat 3-safe (hardhat-toolbox), @openzeppelin/contracts ^5, TypeScript, chai + mocha via toolbox. Local anvil network for tests and E2E; Base Sepolia config ready for Plan 4.

**Consumes (from Plan 1, committed):**
- `data/protocol/trigger_params.json` — per-country `intercept_scaled`, `slope_scaled`, `sigma_scaled` (1e6 fixed point, intercept may be negative), global `k` (2.0), `n_consecutive` (1)
- `data/protocol/risk_allocation.json` — per-country `allocation_weight` (float, scale by 1e6 for on-chain)
- `data/protocol/backtest_report.json` — expected events (TV: 2018/2020/2021/2022) and payout amounts for the equivalence test
- `data/sea_level.json` — TV real readings replayed on-chain in tests

**Key fixed-point conventions (must match everywhere):**
- `SCALE = 1_000_000`; params/weights/z-scores carried as scaled ints
- expected(year) = interceptScaled + slopeScaled * year (int256)
- zScaled = (valueScaled - expected) * SCALE / sigmaScaled (sigma > 0)
- Trigger: zScaled >= kScaled * SCALE... i.e. compare zScaled with kScaled * SCALE. Since zScaled is already "z * 1e6" and kScaled is "k * 1e6", condition: zScaled >= kScaled. Tier: zScaled >= 3*SCALE → 1_000_000 (100%); >= 2*SCALE → 600_000; >= 1*SCALE → 300_000
- payout = (referencePool * tierScaled / SCALE) * weightScaled / SCALE; paid = min(payout, pool balance); shortfall tracked as `outstanding`

**Verification anchor (Python cross-check, TV 2022):** expected = -23.771579 + 0.012126*2022 ≈ 0.7427; value 1.4678; z ≈ 3.02 (Python peak_z 3.0041 — scaled-int rounding differs slightly, tolerance 0.05); tier 100% → payout = 10M * 1.0 * 0.141448 = exactly 1,414,480 tokens (matches `backtest_report.json` to the dollar).

---

### Task 1: Scaffold contracts workspace

**Files:**
- Create: `contracts/package.json`, `contracts/hardhat.config.ts`, `contracts/tsconfig.json`, `contracts/.gitignore`

- [ ] **Step 1: Create directory and package.json**

`contracts/package.json`:

```json
{
  "name": "hightide-contracts",
  "version": "1.0.0",
  "private": true,
  "description": "HighTide Protocol smart contracts (IEEE ClimateChain 2026)",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "node": "hardhat node",
    "deploy:local": "hardhat run scripts/deploy.ts --network hardhat",
    "deploy:base": "hardhat run scripts/deploy.ts --network baseSepolia",
    "clean": "hardhat clean"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^6.0.0",
    "@openzeppelin/contracts": "^5.1.0",
    "hardhat": "^2.26.0",
    "typescript": "^5.6.0",
    "ts-node": "^10.9.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd D:/IEEEClimateChainGlobal2/contracts && npm install`
Expected: completes with a lockfile; no peer errors.

- [ ] **Step 3: Hardhat config**

`contracts/hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hardhat: { chainId: 31337 },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org",
      accounts: process.env.DEPLOYER_PK ? [process.env.DEPLOYER_PK] : [],
    },
  },
};

export default config;
```

If `dotenv` is not pulled in by the toolbox, add it: `npm install -D dotenv`.

- [ ] **Step 4: TypeScript config**

`contracts/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["./scripts", "./test", "./hardhat.config.ts"]
}
```

- [ ] **Step 5: gitignore**

`contracts/.gitignore`:

```
node_modules/
cache/
artifacts/
coverage/
coverage.json/
typechain-types/
.env
.demo-wallets.json
deployments-local.json
```

- [ ] **Step 6: Verify toolchain**

Run: `cd contracts && npx hardhat compile`
Expected: "Compiled successfully" with no contracts yet (or a no-op success). If the toolbox reports missing Solidity, that is fine at this stage.

- [ ] **Step 7: Commit**

```bash
git add contracts
git commit -m "feat(contracts): scaffold Hardhat workspace with Base Sepolia config"
```

---

### Task 2: MockFundToken

**Files:**
- Create: `contracts/contracts/MockFundToken.sol`
- Test: `contracts/test/token.test.ts`

- [ ] **Step 1: Write the failing test**

`contracts/test/token.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MockFundToken", () => {
  it("mints initial supply to deployer and allows public demo mint", async () => {
    const [deployer, donor] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MockFundToken");
    const token = await Token.deploy();
    await token.waitForDeployment();

    const decimals = await token.decimals();
    expect(decimals).to.equal(18n);
    // initial supply: 100M tokens to deployer
    expect(await token.balanceOf(deployer.address)).to.equal(
      ethers.parseEther("100000000")
    );

    // anyone can mint more (testnet-only mock)
    await token.connect(donor).mint(donor.address, ethers.parseEther("5"));
    expect(await token.balanceOf(donor.address)).to.equal(
      ethers.parseEther("5")
    );
  });

  it("transfers as standard ERC20", async () => {
    const [deployer, user] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MockFundToken");
    const token = await Token.deploy();
    await token.waitForDeployment();

    await token.transfer(user.address, ethers.parseEther("10"));
    expect(await token.balanceOf(user.address)).to.equal(
      ethers.parseEther("10")
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd contracts && npx hardhat test test/token.test.ts`
Expected: FAIL — `HardhatError: HH7001 Artifact for contract "MockFundToken" not found`

- [ ] **Step 3: Implement**

`contracts/contracts/MockFundToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockFundToken - testnet-only stand-in for the Loss & Damage fund
///         currency. Public mint on purpose: demo faucets, not real value.
contract MockFundToken is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 ether;

    constructor() ERC20("HighTide Test Dollar", "HTD") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx hardhat test test/token.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add contracts/contracts contracts/test
git commit -m "feat(contracts): mock fund token with public testnet mint"
```

---

### Task 3: ClimateDataRegistry

**Files:**
- Create: `contracts/contracts/ClimateDataRegistry.sol`
- Test: `contracts/test/registry.test.ts`

- [ ] **Step 1: Write the failing test**

`contracts/test/registry.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ClimateDataRegistry", () => {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("ClimateDataRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return { registry, owner, other };
  }

  it("owner anchors a dataset hash with metadata and emits Anchored", async () => {
    const { registry, owner } = await deploy();
    const hash = ethers.id("sea_level_tuvalu_1993_2023");
    const source = "Pacific Data Hub / pacific_sla_monthly_satelite";
    const indicator = "SLA yearly mean";

    await expect(
      registry
        .connect(owner)
        .anchor(hash, source, indicator, 2005, 2025)
    ).to.emit(registry, "Anchored").withArgs(hash, source, indicator, 2005, 2025);

    const anchor = await registry.getAnchor(hash);
    expect(anchor.source).to.equal(source);
    expect(anchor.periodStart).to.equal(2005n);
    expect(anchor.periodEnd).to.equal(2025n);
    expect(anchor.anchoredAt).to.be.greaterThan(0n);
  });

  it("non-owner cannot anchor", async () => {
    const { registry, other } = await deploy();
    await expect(
      registry.connect(other).anchor(ethers.id("x"), "s", "i", 2000, 2020)
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  it("re-anchoring the same hash is rejected (immutable provenance)", async () => {
    const { registry, owner } = await deploy();
    const hash = ethers.id("dup");
    await registry.connect(owner).anchor(hash, "s", "i", 2000, 2020);
    await expect(
      registry.connect(owner).anchor(hash, "s2", "i2", 2001, 2021)
    ).to.be.revertedWithCustomError(registry, "AlreadyAnchored");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx hardhat test test/registry.test.ts`
Expected: FAIL — artifact not found for "ClimateDataRegistry".

- [ ] **Step 3: Implement**

`contracts/contracts/ClimateDataRegistry.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ClimateDataRegistry - immutably anchors dataset and AI-output
///        hashes so every number the protocol uses is provably the number
///        that was published.
contract ClimateDataRegistry is Ownable {
    struct Anchor {
        string source;
        string indicator;
        uint32 periodStart;
        uint32 periodEnd;
        uint64 anchoredAt;
    }

    event Anchored(
        bytes32 indexed dataHash,
        string source,
        string indicator,
        uint32 periodStart,
        uint32 periodEnd
    );

    error AlreadyAnchored(bytes32 dataHash);

    mapping(bytes32 => Anchor) private _anchors;
    mapping(bytes32 => bool) private _exists;

    constructor() Ownable(msg.sender) {}

    function anchor(
        bytes32 dataHash,
        string calldata source,
        string calldata indicator,
        uint32 periodStart,
        uint32 periodEnd
    ) external onlyOwner {
        if (_exists[dataHash]) revert AlreadyAnchored(dataHash);
        _exists[dataHash] = true;
        _anchors[dataHash] = Anchor({
            source: source,
            indicator: indicator,
            periodStart: periodStart,
            periodEnd: periodEnd,
            anchoredAt: uint64(block.timestamp)
        });
        emit Anchored(dataHash, source, indicator, periodStart, periodEnd);
    }

    function getAnchor(bytes32 dataHash) external view returns (Anchor memory) {
        return _anchors[dataHash];
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx hardhat test test/registry.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add contracts/contracts contracts/test
git commit -m "feat(contracts): immutable data hash registry with provenance metadata"
```

---

### Task 4: HighTidePool — country params, funding, access control

This task deploys the pool contract with configuration surface; trigger logic comes in Task 5-6 behind the same contract (tests added incrementally).

**Files:**
- Create: `contracts/contracts/HighTidePool.sol` (full contract including trigger code — this task's tests only cover configuration/funding; later tasks test the rest)
- Test: `contracts/test/pool_config.test.ts`

- [ ] **Step 1: Write the failing test**

`contracts/test/pool_config.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("HighTidePool configuration", () => {
  async function deploy() {
    const [owner, oracle, other] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MockFundToken");
    const token = await Token.deploy();
    await token.waitForDeployment();

    const Registry = await ethers.getContractFactory("ClimateDataRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    const Pool = await ethers.getContractFactory("HighTidePool");
    const pool = await Pool.deploy(
      await token.getAddress(),
      await registry.getAddress(),
      oracle.address,
      ethers.parseEther("10000000")
    );
    await pool.waitForDeployment();
    return { pool, token, registry, owner, oracle, other };
  }

  const tvParams = {
    name: "Tuvalu",
    interceptScaled: -23_771_579n,
    slopeScaled: 12_126n,
    sigmaScaled: 239_830n,
    kScaled: 2_000_000n,
    nConsecutive: 1,
    weightScaled: 141_448n,
  };

  it("owner sets a country with 1e6 fixed-point params", async () => {
    const { pool, owner, other } = await deploy();
    const beneficiary = other.address;
    await pool
      .connect(owner)
      .setCountry(
        "0x5456", // "TV"
        tvParams.name,
        tvParams.interceptScaled,
        tvParams.slopeScaled,
        tvParams.sigmaScaled,
        tvParams.kScaled,
        tvParams.nConsecutive,
        tvParams.weightScaled,
        beneficiary
      );

    const stored = await pool.countryParams("0x5456");
    expect(stored.name).to.equal("Tuvalu");
    expect(stored.interceptScaled).to.equal(tvParams.interceptScaled);
    expect(stored.slopeScaled).to.equal(tvParams.slopeScaled);
    expect(stored.sigmaScaled).to.equal(tvParams.sigmaScaled);
    expect(stored.kScaled).to.equal(tvParams.kScaled);
    expect(stored.nConsecutive).to.equal(1n);
    expect(stored.weightScaled).to.equal(tvParams.weightScaled);
    expect(stored.beneficiary).to.equal(beneficiary);
  });

  it("non-owner cannot set countries or oracle", async () => {
    const { pool, other } = await deploy();
    await expect(
      pool.connect(other).setCountry(
        "0x5456", "Tuvalu", 0n, 0n, 1n, 2_000_000n, 1, 100_000n, other.address
      )
    ).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");

    await expect(
      pool.connect(other).setOracle(other.address)
    ).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
  });

  it("donors fund the pool by ERC20 transfer; Funded emitted", async () => {
    const { pool, token, other } = await deploy();
    const amount = ethers.parseEther("1000");
    await token.mint(other.address, amount);
    await token.connect(other).approve(await pool.getAddress(), amount);

    await expect(pool.connect(other).fund(amount))
      .to.emit(pool, "Funded")
      .withArgs(other.address, amount);
    expect(await token.balanceOf(await pool.getAddress())).to.equal(amount);
  });

  it("exposes reference pool and token", async () => {
    const { pool, token } = await deploy();
    expect(await pool.referencePool()).to.equal(ethers.parseEther("10000000"));
    expect(await pool.token()).to.equal(await token.getAddress());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx hardhat test test/pool_config.test.ts`
Expected: FAIL — artifact not found for "HighTidePool".

- [ ] **Step 3: Implement the full contract (trigger + payout included; tested next)**

`contracts/contracts/HighTidePool.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title HighTidePool - parametric Loss & Damage payout engine.
/// @notice Verifies EIP-712-signed oracle readings, evaluates trend-adjusted
///         trigger thresholds (1e6 fixed point, mirroring the off-chain AI
///         engine), pays affected countries, and makes double counting
///         impossible: one evaluation per (country, year), one payout per
///         event id.
contract HighTidePool is Ownable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    uint256 public constant SCALE = 1_000_000;

    struct CountryParams {
        string name;
        int256 interceptScaled; // 1e6
        int256 slopeScaled;     // 1e6
        int256 sigmaScaled;     // 1e6, > 0
        uint256 kScaled;        // 1e6
        uint8 nConsecutive;     // readings above threshold to fire
        uint64 weightScaled;    // 1e6, share of reference pool
        address beneficiary;
    }

    struct TriggerState {
        uint8 streak;
        int256 bestZScaled; // max z within current streak, 1e6
        uint32 streakStartYear;
    }

    struct PayoutRecord {
        address beneficiary;
        uint256 amount;      // entitlement
        uint256 paid;        // actually transferred
        uint256 outstanding; // unpaid remainder when pool ran short
        bool executed;
    }

    IERC20 public immutable token;
    address public immutable registry;
    uint256 public immutable referencePool; // fund size per full allocation

    address public oracle;

    mapping(bytes2 => CountryParams) public countryParams;
    mapping(bytes2 => TriggerState) private _states;
    mapping(bytes2 => mapping(uint32 => bool)) public yearEvaluated;
    mapping(bytes32 => PayoutRecord) public payouts;
    mapping(bytes2 => uint256) public totalPaidByCountry;

    // EIP-712: Reading(bytes2 country, uint32 year, int256 valueScaled)
    bytes32 public constant READING_TYPEHASH =
        keccak256("Reading(bytes2 country,uint32 year,int256 valueScaled)");
    bytes32 public immutable DOMAIN_SEPARATOR;

    event OracleSet(address indexed oracle);
    event CountrySet(bytes2 indexed code, string name);
    event Funded(address indexed donor, uint256 amount);
    event Triggered(
        bytes2 indexed country,
        bytes32 indexed eventId,
        uint32 startYear,
        uint32 endYear,
        int256 peakZScaled,
        uint256 tierScaled
    );
    event PayoutExecuted(
        bytes32 indexed eventId,
        address indexed beneficiary,
        uint256 amount,
        uint256 paid,
        uint256 outstanding
    );

    error UnknownCountry(bytes2 country);
    error InvalidSignature(address recovered);
    error ReadingAlreadyEvaluated(bytes2 country, uint32 year);
    error PayoutAlreadyExecuted(bytes32 eventId);
    error ZeroSigma(bytes2 country);
    error ZeroWeight(bytes2 country);

    constructor(
        address token_,
        address registry_,
        address oracle_,
        uint256 referencePool_
    ) Ownable(msg.sender) {
        token = IERC20(token_);
        registry = registry_;
        oracle = oracle_;
        referencePool = referencePool_;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("HighTideOracle")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function setOracle(address oracle_) external onlyOwner {
        oracle = oracle_;
        emit OracleSet(oracle_);
    }

    function setCountry(
        bytes2 code,
        string calldata name,
        int256 interceptScaled,
        int256 slopeScaled,
        int256 sigmaScaled,
        uint256 kScaled,
        uint8 nConsecutive,
        uint64 weightScaled,
        address beneficiary
    ) external onlyOwner {
        if (sigmaScaled <= 0) revert ZeroSigma(code);
        if (weightScaled == 0) revert ZeroWeight(code);
        countryParams[code] = CountryParams({
            name: name,
            interceptScaled: interceptScaled,
            slopeScaled: slopeScaled,
            sigmaScaled: sigmaScaled,
            kScaled: kScaled,
            nConsecutive: nConsecutive,
            weightScaled: weightScaled,
            beneficiary: beneficiary
        });
        emit CountrySet(code, name);
    }

    function fund(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Funded(msg.sender, amount);
    }

    // ------------------------------------------------------------------
    // Trigger evaluation
    // ------------------------------------------------------------------

    function expectedScaled(bytes2 code, uint32 year) public view returns (int256) {
        CountryParams memory p = countryParams[code];
        return p.interceptScaled + p.slopeScaled * int256(uint256(year));
    }

    function zScoreScaled(
        bytes2 code,
        uint32 year,
        int256 valueScaled
    ) public view returns (int256) {
        CountryParams memory p = countryParams[code];
        return ((valueScaled - expectedScaled(code, year)) * int256(SCALE)) / p.sigmaScaled;
    }

    function tierScaledFor(int256 z) public pure returns (uint256) {
        if (z >= 3 * int256(SCALE)) return 1_000_000; // 100%
        if (z >= 2 * int256(SCALE)) return 600_000;   // 60%
        if (z >= 1 * int256(SCALE)) return 300_000;   // 30%
        return 0;
    }

    function submitReading(
        bytes2 country,
        uint32 year,
        int256 valueScaled,
        bytes calldata signature
    ) external {
        CountryParams memory p = countryParams[country];
        if (bytes(p.name).length == 0) revert UnknownCountry(country);
        if (yearEvaluated[country][year]) {
            revert ReadingAlreadyEvaluated(country, year);
        }

        bytes32 structHash = keccak256(
            abi.encode(READING_TYPEHASH, country, year, valueScaled)
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        address recovered = digest.recover(signature);
        if (recovered != oracle) revert InvalidSignature(recovered);

        yearEvaluated[country][year] = true;

        TriggerState storage st = _states[country];
        int256 z = zScoreScaled(country, year, valueScaled);
        if (z >= int256(p.kScaled)) {
            if (st.streak == 0) st.streakStartYear = year;
            st.streak += 1;
            if (z > st.bestZScaled) st.bestZScaled = z;
        } else {
            st.streak = 0;
            st.bestZScaled = 0;
        }

        if (st.streak == p.nConsecutive) {
            // snapshot then reset - mirrors hightide/stats.py update_trigger
            int256 peakZ = st.bestZScaled;
            uint32 startYear = st.streakStartYear;
            st.streak = 0;
            st.bestZScaled = 0;
            st.streakStartYear = 0;

            bytes32 eventId =
                keccak256(abi.encodePacked(country, startYear, year));
            if (payouts[eventId].executed) revert PayoutAlreadyExecuted(eventId);

            uint256 tier = tierScaledFor(peakZ);
            uint256 amount =
                (referencePool * tier / SCALE) * uint256(p.weightScaled) / SCALE;

            emit Triggered(country, eventId, startYear, year, peakZ, tier);
            _pay(eventId, p.beneficiary, country, amount);
        }
    }

    function _pay(
        bytes32 eventId,
        address beneficiary,
        bytes2 country,
        uint256 amount
    ) private {
        uint256 balance = token.balanceOf(address(this));
        uint256 paid = balance >= amount ? amount : balance;
        uint256 outstanding = amount - paid;

        payouts[eventId] = PayoutRecord({
            beneficiary: beneficiary,
            amount: amount,
            paid: paid,
            outstanding: outstanding,
            executed: true
        });
        totalPaidByCountry[country] += paid;
        if (paid > 0) {
            token.safeTransfer(beneficiary, paid);
        }
        emit PayoutExecuted(eventId, beneficiary, amount, paid, outstanding);
    }
}
```

Note: `amount` computation uses `referencePool * tier / SCALE` first (tier is at most 1e6 so this is exact for tier=1e6), then scaled by weight. Matches the Python payout math exactly on real inputs (see Task 6).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx hardhat test test/pool_config.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add contracts/contracts contracts/test
git commit -m "feat(contracts): HighTidePool config surface, funding and access control"
```

---

### Task 5: EIP-712 oracle signature verification

**Files:**
- Test: `contracts/test/pool_signature.test.ts`
- Create: `contracts/test/helpers.ts`

- [ ] **Step 1: Write the failing test**

`contracts/test/helpers.ts` (shared fixture + signer):

```typescript
import { ethers } from "hardhat";

export async function deployPoolFixture() {
  const [owner, oracle, donor, beneficiary] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("MockFundToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const Registry = await ethers.getContractFactory("ClimateDataRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const Pool = await ethers.getContractFactory("HighTidePool");
  const pool = await Pool.deploy(
    await token.getAddress(),
    await registry.getAddress(),
    oracle.address,
    ethers.parseEther("10000000")
  );
  await pool.waitForDeployment();

  return { pool, token, registry, owner, oracle, donor, beneficiary };
}

export const READING_TYPES = {
  Reading: [
    { name: "country", type: "bytes2" },
    { name: "year", type: "uint32" },
    { name: "valueScaled", type: "int256" },
  ],
};

export function eip712Domain(poolAddress: string, chainId: bigint | number) {
  return {
    name: "HighTideOracle",
    version: "1",
    chainId,
    verifyingContract: poolAddress,
  };
}

export const TV = "0x5456";

export const TV_PARAMS = {
  name: "Tuvalu",
  interceptScaled: -23_771_579n,
  slopeScaled: 12_126n,
  sigmaScaled: 239_830n,
  kScaled: 2_000_000n,
  nConsecutive: 1,
  weightScaled: 141_448n,
};

export async function signReading(
  oracleSigner: any,
  poolAddress: string,
  chainId: bigint | number,
  country: string,
  year: number,
  valueScaled: bigint
) {
  return oracleSigner.signTypedData(
    eip712Domain(poolAddress, chainId),
    READING_TYPES,
    { country, year, valueScaled }
  );
}
```

`contracts/test/pool_signature.test.ts`:

```typescript
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  deployPoolFixture,
  signReading,
  TV,
  TV_PARAMS,
} from "./helpers";

describe("HighTidePool oracle signatures", () => {
  it("accepts a valid EIP-712 signature from the registered oracle", async () => {
    const { pool, owner, oracle, beneficiary } = await deployPoolFixture();
    await pool.connect(owner).setCountry(
      TV, TV_PARAMS.name, TV_PARAMS.interceptScaled, TV_PARAMS.slopeScaled,
      TV_PARAMS.sigmaScaled, TV_PARAMS.kScaled, TV_PARAMS.nConsecutive,
      TV_PARAMS.weightScaled, beneficiary.address
    );

    const chainId = network.config.chainId ?? 31337;
    const sig = await signReading(
      oracle, await pool.getAddress(), chainId, TV, 2022, 1_467_800n
    );
    await expect(
      pool.submitReading(TV, 2022, 1_467_800n, sig)
    ).to.emit(pool, "Triggered");
  });

  it("rejects a signature from a non-oracle key", async () => {
    const { pool, owner, oracle, beneficiary, donor } = await deployPoolFixture();
    await pool.connect(owner).setCountry(
      TV, TV_PARAMS.name, TV_PARAMS.interceptScaled, TV_PARAMS.slopeScaled,
      TV_PARAMS.sigmaScaled, TV_PARAMS.kScaled, TV_PARAMS.nConsecutive,
      TV_PARAMS.weightScaled, beneficiary.address
    );

    const chainId = network.config.chainId ?? 31337;
    const forgedSig = await signReading(
      donor, await pool.getAddress(), chainId, TV, 2022, 1_467_800n
    );
    await expect(
      pool.submitReading(TV, 2022, 1_467_800n, forgedSig)
    ).to.be.revertedWithCustomError(pool, "InvalidSignature");
  });

  it("rejects replay of an already-evaluated (country, year) reading", async () => {
    const { pool, owner, oracle, beneficiary } = await deployPoolFixture();
    await pool.connect(owner).setCountry(
      TV, TV_PARAMS.name, TV_PARAMS.interceptScaled, TV_PARAMS.slopeScaled,
      TV_PARAMS.sigmaScaled, TV_PARAMS.kScaled, TV_PARAMS.nConsecutive,
      TV_PARAMS.weightScaled, beneficiary.address
    );

    const chainId = network.config.chainId ?? 31337;
    const value = 1_467_800n;
    const sig = await signReading(
      oracle, await pool.getAddress(), chainId, TV, 2022, value
    );
    await pool.submitReading(TV, 2022, value, sig);

    // same reading submitted again (the "double claim" attack)
    await expect(
      pool.submitReading(TV, 2022, value, sig)
    ).to.be.revertedWithCustomError(pool, "ReadingAlreadyEvaluated");

    // even a fresh valid signature for the same year cannot evaluate twice
    const sig2 = await signReading(
      oracle, await pool.getAddress(), chainId, TV, 2022, value
    );
    await expect(
      pool.submitReading(TV, 2022, value, sig2)
    ).to.be.revertedWithCustomError(pool, "ReadingAlreadyEvaluated");
  });

  it("rejects unknown countries", async () => {
    const { pool, oracle } = await deployPoolFixture();
    const chainId = network.config.chainId ?? 31337;
    const sig = await signReading(
      oracle, await pool.getAddress(), chainId, "0x5858", 2022, 1_000_000n
    );
    await expect(
      pool.submitReading("0x5858", 2022, 1_000_000n, sig)
    ).to.be.revertedWithCustomError(pool, "UnknownCountry");
  });
});
```

- [ ] **Step 2: Run test to verify it fails/passes honestly**

Run: `npx hardhat test test/pool_signature.test.ts`
Expected: all 4 passing (contract already implemented in Task 4 — these tests specify the signature semantics; any failure means a contract bug to fix now, not later).

- [ ] **Step 3: Commit**

```bash
git add contracts/test
git commit -m "test(contracts): EIP-712 oracle verification accepts, rejects, and blocks replays"
```

---

### Task 6: Trigger math — on-chain vs Python equivalence on real data

**Files:**
- Test: `contracts/test/pool_trigger_realdata.test.ts`

- [ ] **Step 1: Write the failing test**

`contracts/test/pool_trigger_realdata.test.ts`:

```typescript
import { expect } from "chai";
import fs from "node:fs";
import path from "node:path";
import { ethers, network } from "hardhat";
import { deployPoolFixture, signReading, TV } from "./helpers";

const REPO = path.join(__dirname, "..", "..");
const seaLevel = JSON.parse(
  fs.readFileSync(path.join(REPO, "data", "sea_level.json"), "utf8")
);
const triggerParams = JSON.parse(
  fs.readFileSync(path.join(REPO, "data", "protocol", "trigger_params.json"), "utf8")
);
const riskAllocation = JSON.parse(
  fs.readFileSync(path.join(REPO, "data", "protocol", "risk_allocation.json"), "utf8")
);
const backtest = JSON.parse(
  fs.readFileSync(path.join(REPO, "data", "protocol", "backtest_report.json"), "utf8")
);

/** Convert float meters to 1e6-scaled bigint exactly as the deploy script does. */
function toScaled(floatValue: number): bigint {
  return BigInt(Math.round(floatValue * 1_000_000));
}

describe("HighTidePool on-chain vs Python backtest (real data)", () => {
  it("replaying Tuvalu 2005-2025 reproduces the Python backtest events, tiers and payouts", async () => {
    const { pool, token, owner, oracle, beneficiary, donor } =
      await deployPoolFixture();

    // configure TV exactly from Plan 1 outputs
    const tvJson = triggerParams.countries["TV"];
    const tvWeight = riskAllocation.countries["TV"].allocation_weight;
    await pool.connect(owner).setCountry(
      TV,
      tvJson.name,
      BigInt(tvJson.intercept_scaled),
      BigInt(tvJson.slope_scaled),
      BigInt(tvJson.sigma_scaled),
      toScaled(triggerParams.k),
      triggerParams.n_consecutive,
      BigInt(Math.round(tvWeight * 1_000_000)),
      beneficiary.address
    );

    // fund the pool with the full reference pool
    const poolAmount = ethers.parseEther("10000000");
    await token.mint(donor.address, poolAmount);
    await token
      .connect(donor)
      .approve(await pool.getAddress(), poolAmount);
    await pool.connect(donor).fund(poolAmount);

    // replay the real series
    const chainId = network.config.chainId ?? 31337;
    const series: Array<{ year: number; value: number }> =
      seaLevel["Tuvalu"].series;
    const fired: Array<{ startYear: bigint; endYear: bigint; peakZ: bigint; tier: bigint }> = [];

    pool.on("Triggered", (
      _country: string,
      _eventId: string,
      startYear: bigint,
      endYear: bigint,
      peakZ: bigint,
      tier: bigint
    ) => {
      fired.push({ startYear, endYear, peakZ, tier });
    });

    for (const point of series) {
      const sig = await signReading(
        oracle, await pool.getAddress(), chainId, TV,
        point.year, toScaled(point.value)
      );
      await pool.submitReading(TV, point.year, toScaled(point.value), sig);
    }

    // expected: the Python backtest's TV events
    const expected = backtest.events.filter(
      (e: any) => e.iso2 === "TV"
    );
    expect(fired.length).to.equal(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(Number(fired[i].endYear)).to.equal(expected[i].end_year);
      // on-chain z (scaled-int math) within 0.05 of Python float z
      const zOnChain = Number(fired[i].peakZ) / 1e6;
      expect(Math.abs(zOnChain - expected[i].peak_z)).to.be.lessThan(0.05);
      expect(Number(fired[i].tier) / 1e6).to.equal(
        expected[i].tier_payout_fraction
      );
    }

    // payouts match to the wei: accumulated tier * weight * referencePool
    const tvWeightScaled = BigInt(Math.round(tvWeight * 1_000_000));
    const totalExpectedWei = expected.reduce(
      (sum: bigint, e: any) =>
        sum + (poolAmount * BigInt(Math.round(e.tier_payout_fraction * 1e6)) / 1_000_000n)
          * tvWeightScaled / 1_000_000n,
      0n
    );
    expect(await pool.totalPaidByCountry(TV)).to.equal(totalExpectedWei);
    expect(await token.balanceOf(beneficiary.address)).to.equal(totalExpectedWei);
  });

  it("z-score matches Python for TV 2022 within rounding", async () => {
    const { pool, owner, beneficiary } = await deployPoolFixture();
    const tvJson = triggerParams.countries["TV"];
    await pool.connect(owner).setCountry(
      TV, tvJson.name,
      BigInt(tvJson.intercept_scaled), BigInt(tvJson.slope_scaled),
      BigInt(tvJson.sigma_scaled), toScaled(triggerParams.k),
      triggerParams.n_consecutive, 100_000n, beneficiary.address
    );
    const value2022 = toScaled(
      seaLevel["Tuvalu"].series.find((p: any) => p.year === 2022).value
    );
    const z = await pool.zScoreScaled(TV, 2022, value2022);
    const pythonZ = backtest.events.find(
      (e: any) => e.iso2 === "TV" && e.end_year === 2022
    ).peak_z;
    expect(Math.abs(Number(z) / 1e6 - pythonZ)).to.be.lessThan(0.05);
  });
});
```

- [ ] **Step 2: Run test**

Run: `npx hardhat test test/pool_trigger_realdata.test.ts`
Expected: 2 passing. If z tolerance fails, print both values and investigate BEFORE touching tolerances — the scaled-int math should track Python to ~1e-3. If the trigger years mismatch, the state machine diverges from `hightide/stats.py` — fix the contract, not the test.

- [ ] **Step 3: Commit**

```bash
git add contracts/test
git commit -m "test(contracts): on-chain trigger reproduces Python backtest on real Tuvalu series"
```

---

### Task 7: Payout economics — pro-rata, records, double-event impossibility

**Files:**
- Test: `contracts/test/pool_payout.test.ts`

- [ ] **Step 1: Write the failing test**

`contracts/test/pool_payout.test.ts`:

```typescript
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  deployPoolFixture,
  signReading,
  TV,
  TV_PARAMS,
} from "./helpers";

const FULL_POOL = ethers.parseEther("10000000");
// tier 100% x weight 0.141448 x 10M = exactly 1,414,480 HTD
const TV_FULL_PAYOUT = 1_414_480n * 10n ** 18n;

describe("HighTidePool payouts", () => {
  async function setup(poolFunding: bigint) {
    const fix = await deployPoolFixture();
    const { pool, token, owner, oracle, beneficiary, donor } = fix;
    await pool.connect(owner).setCountry(
      TV, TV_PARAMS.name, TV_PARAMS.interceptScaled, TV_PARAMS.slopeScaled,
      TV_PARAMS.sigmaScaled, TV_PARAMS.kScaled, TV_PARAMS.nConsecutive,
      TV_PARAMS.weightScaled, beneficiary.address
    );
    if (poolFunding > 0n) {
      await token.mint(donor.address, poolFunding);
      await token.connect(donor).approve(await pool.getAddress(), poolFunding);
      await pool.connect(donor).fund(poolFunding);
    }
    return fix;
  }

  async function submit2022(pool: any, oracle: any, beneficiary: any) {
    const chainId = network.config.chainId ?? 31337;
    // TV 2022 real reading 1.4678 -> 1_467_800 (1e6 scale)
    const sig = await signReading(
      oracle, await pool.getAddress(), chainId, TV, 2022, 1_467_800n
    );
    await expect(
      pool.submitReading(TV, 2022, 1_467_800n, sig)
    ).to.emit(pool, "Triggered");
  }

  it("full pool: pays exactly tier * weight * referencePool", async () => {
    const { pool, token, beneficiary } = await setup(FULL_POOL);
    await submit2022(pool, (await ethers.getSigners())[1], beneficiary);

    expect(await token.balanceOf(beneficiary.address)).to.equal(TV_FULL_PAYOUT);
    expect(await pool.totalPaidByCountry(TV)).to.equal(TV_FULL_PAYOUT);
  });

  it("underfunded pool: pro-rata payout with tracked outstanding", async () => {
    const partial = ethers.parseEther("500000"); // 500k < 1.414M
    const { pool, token, beneficiary } = await setup(partial);
    await submit2022(pool, (await ethers.getSigners())[1], beneficiary);

    expect(await token.balanceOf(beneficiary.address)).to.equal(partial);
    // record shows entitlement, paid, outstanding
    const eventId = await poolEventId(pool, 2022);
    const rec = await pool.payouts(eventId);
    expect(rec.amount).to.equal(TV_FULL_PAYOUT);
    expect(rec.paid).to.equal(partial);
    expect(rec.outstanding).to.equal(TV_FULL_PAYOUT - partial);
    expect(rec.executed).to.equal(true);
  });

  it("the same event id can never be paid twice (N=1: one event per year)", async () => {
    const { pool, beneficiary } = await setup(FULL_POOL);
    await submit2022(pool, (await ethers.getSigners())[1], beneficiary);
    // a second 2022 submission is rejected at the year-evaluation gate
    const chainId = network.config.chainId ?? 31337;
    const { oracle } = { oracle: (await ethers.getSigners())[1] };
    const sig = await signReading(
      oracle, await pool.getAddress(), chainId, TV, 2022, 1_467_800n
    );
    await expect(
      pool.submitReading(TV, 2022, 1_467_800n, sig)
    ).to.be.revertedWithCustomError(pool, "ReadingAlreadyEvaluated");
  });
});

async function poolEventId(pool: any, year: number) {
  // eventId = keccak256(abi.encodePacked(country, startYear, endYear)); N=1 => start==end
  return ethers.solidityPackedKeccak256(
    ["bytes2", "uint32", "uint32"],
    ["0x5456", year, year]
  );
}
```

- [ ] **Step 2: Run tests**

Run: `npx hardhat test`
Expected: entire suite green (token 2 + registry 3 + config 4 + signature 4 + realdata 2 + payout 3 = 18 passing).

- [ ] **Step 3: Commit**

```bash
git add contracts/test
git commit -m "test(contracts): pro-rata payouts, records and event uniqueness"
```

---

### Task 8: Deploy script (local), README, final verification

**Files:**
- Create: `contracts/scripts/deploy.ts`
- Create: `contracts/README.md`

- [ ] **Step 1: Implement the deploy script**

`contracts/scripts/deploy.ts`:

```typescript
import fs from "node:fs";
import path from "node:path";
import { ethers, network } from "hardhat";

const REPO = path.join(__dirname, "..", "..");

function loadJson(rel: string): any {
  return JSON.parse(fs.readFileSync(path.join(REPO, rel), "utf8"));
}

async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`Deploying on network "${network.name}" from ${owner.address}`);

  const triggerParams = loadJson("data/protocol/trigger_params.json");
  const riskAllocation = loadJson("data/protocol/risk_allocation.json");

  // Demo beneficiaries: deterministic random test wallets (gitignored file).
  // Testnet-only: these keys hold no real value; replace for any real use.
  const walletsPath = path.join(__dirname, "..", ".demo-wallets.json");
  let wallets: { address: string; privateKey: string }[];
  if (fs.existsSync(walletsPath)) {
    wallets = JSON.parse(fs.readFileSync(walletsPath, "utf8"));
  } else {
    wallets = Array.from({ length: 13 }, () => {
      const w = ethers.Wallet.createRandom();
      return { address: w.address, privateKey: w.privateKey };
    });
    fs.writeFileSync(walletsPath, JSON.stringify(wallets, null, 2));
    console.log(`Generated 13 demo beneficiary wallets -> ${walletsPath}`);
  }

  const Token = await ethers.getContractFactory("MockFundToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const Registry = await ethers.getContractFactory("ClimateDataRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  // oracle: for local demos the second signer; on testnets set via env
  const oracleAddress =
    process.env.ORACLE_ADDRESS ?? (await ethers.getSigners())[1].address;

  const Pool = await ethers.getContractFactory("HighTidePool");
  const pool = await Pool.deploy(
    await token.getAddress(),
    await registry.getAddress(),
    oracleAddress,
    ethers.parseEther("10000000")
  );
  await pool.waitForDeployment();

  console.log("MockFundToken:   ", await token.getAddress());
  console.log("ClimateRegistry: ", await registry.getAddress());
  console.log("HighTidePool:    ", await pool.getAddress());
  console.log("Oracle:          ", oracleAddress);

  // Configure all countries from Plan 1 outputs
  const codes = Object.keys(triggerParams.countries);
  let i = 0;
  for (const code of codes) {
    const c = triggerParams.countries[code];
    const weight = riskAllocation.countries[code]?.allocation_weight;
    if (weight === undefined) {
      console.log(`  skip ${code} (${c.name}): no allocation weight`);
      continue;
    }
    await pool.setCountry(
      "0x" + Buffer.from(code, "ascii").toString("hex"),
      c.name,
      BigInt(c.intercept_scaled),
      BigInt(c.slope_scaled),
      BigInt(c.sigma_scaled),
      BigInt(Math.round(triggerParams.k * 1_000_000)),
      c.n_consecutive,
      BigInt(Math.round(weight * 1_000_000)),
      wallets[i].address
    );
    console.log(`  configured ${code} ${c.name} -> ${wallets[i].address}`);
    i++;
  }

  // Anchor every protocol output hash in the registry
  for (const file of [
    "trigger_params",
    "forecasts",
    "risk_allocation",
    "backtest_report",
  ]) {
    const bytes = fs.readFileSync(
      path.join(REPO, "data", "protocol", `${file}.json`)
    );
    const hash = ethers.keccak256(bytes);
    await registry.anchor(hash, `data/protocol/${file}.json`, file, 2005, 2025);
    console.log(`  anchored ${file}: ${hash}`);
  }

  // Persist addresses + ABIs for the keeper and dashboard
  const artifacts = {
    network: network.name,
    chainId: network.config.chainId,
    token: await token.getAddress(),
    registry: await registry.getAddress(),
    pool: await pool.getAddress(),
    oracle: oracleAddress,
    referencePool: ethers.parseEther("10000000").toString(),
    beneficiaries: Object.fromEntries(
      codes.map((code, idx) => [code, wallets[idx].address])
    ),
    abi: {
      pool: (await ethers.getContractFactory("HighTidePool")).interface.formatJson(),
      registry: (await ethers.getContractFactory("ClimateDataRegistry")).interface.formatJson(),
      token: (await ethers.getContractFactory("MockFundToken")).interface.formatJson(),
    },
  };
  const outPath = path.join(__dirname, "..", `deployments-${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(artifacts, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Smoke-test against the in-process hardhat network**

Run: `cd contracts && npx hardhat run scripts/deploy.ts --network hardhat`
Expected: prints 3 addresses, 13 "configured ..." lines, 4 "anchored ..." lines, writes `deployments-hardhat.json`.

- [ ] **Step 3: Write README**

`contracts/README.md`:

```markdown
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

18 tests, including a real-data equivalence test replaying Tuvalu's
2005-2025 series on-chain and matching the Python backtest event-for-event.

## Deploy (local)

    npx hardhat run scripts/deploy.ts --network hardhat

Writes `deployments-hardhat.json` (addresses, beneficiaries, ABIs) for the
keeper and dashboard. Base Sepolia: `npm run deploy:base` with
`DEPLOYER_PK` and optionally `ORACLE_ADDRESS` in `.env`.

## Honesty

Test tokens on a public testnet only. The oracle is a single registered
signer for the demo; the production path is a decentralized oracle
network (e.g. Chainlink) - see the project README's mock-vs-real table.
```

- [ ] **Step 4: Full suite + compile clean**

Run: `npx hardhat compile && npx hardhat test`
Expected: compiles clean, 18 passing.

- [ ] **Step 5: Commit**

```bash
git add contracts
git commit -m "feat(contracts): deploy script wiring Plan 1 outputs on-chain with anchored hashes"
```

---

## Completion criteria for Plan 2

- [ ] `npx hardhat compile` clean; `npx hardhat test` 18 passing
- [ ] Real-data equivalence test green: on-chain replay of Tuvalu 2005-2025 fires the same 4 events (2018/2020/2021/2022) with matching tiers and exact wei payouts vs `backtest_report.json`
- [ ] Anti-double-count proven in tests: year-evaluation gate + unique event ids
- [ ] Pro-rata + outstanding tracking tested
- [ ] `deploy.ts` runs on the in-process network and writes `deployments-hardhat.json` (addresses, beneficiaries, ABIs)
- [ ] README documents fixed-point conventions and honesty boundaries

Plans 3 (keeper/E2E on anvil) and 4 (testnet deploy + dashboard) consume `deployments-*.json` exactly as produced here.
