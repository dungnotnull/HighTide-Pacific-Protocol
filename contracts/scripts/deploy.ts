import fs from "node:fs";
import path from "node:path";
import { ethers, network } from "hardhat";

const REPO = path.join(__dirname, "..", "..");

function loadJson(rel: string): any {
  return JSON.parse(fs.readFileSync(path.join(REPO, rel), "utf8"));
}

async function main() {
  const [owner] = await ethers.getSigners();
  console.log(`Deploying on network "${network.name}" from ${owner.address.substring(0,6)}...xxxxxxxxxxxxx`);

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

  console.log("MockFundToken:   ", (await token.getAddress()).substring(0,6) + '...xxxxxxxxxxxxx');
  console.log("ClimateRegistry: ", (await registry.getAddress()).substring(0,6) + '...xxxxxxxxxxxxx');
  console.log("HighTidePool:    ", (await pool.getAddress()).substring(0,6) + '...xxxxxxxxxxxxx');
  console.log("Oracle:          ", oracleAddress.substring(0,6) + '...xxxxxxxxxxxxx');

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
    console.log(`  configured ${code} ${c.name} -> ${wallets[i].address.substring(0,6)}...xxxxxxxxxxxxx`);
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
    console.log(`  anchored ${file}: ${hash.substring(0,6)}...xxxxxxxxxxxxx`);
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
