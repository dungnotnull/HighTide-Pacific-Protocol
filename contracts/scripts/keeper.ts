import fs from "node:fs";
import path from "node:path";
import { ethers, network } from "hardhat";

const REPO = path.join(__dirname, "..", "..");

function loadDeployments(): any {
  const p = path.join(__dirname, "..", `deployments-${network.name}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(
      `${p} not found - run "npm run demo:deploy" first (with the node running)`
    );
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function poolContract(dep: any, signer: any) {
  return new ethers.Contract(dep.pool, dep.abi.pool, signer);
}

function tokenContract(dep: any, signer: any) {
  return new ethers.Contract(dep.token, dep.abi.token, signer);
}

function seaLevelSeries(countryName: string) {
  const raw = JSON.parse(
    fs.readFileSync(path.join(REPO, "data", "sea_level.json"), "utf8")
  );
  return raw[countryName].series as Array<{ year: number; value: number }>;
}

function toScaled(value: number): bigint {
  return BigInt(Math.round(value * 1_000_000));
}

const READING_TYPES = {
  Reading: [
    { name: "country", type: "bytes2" },
    { name: "year", type: "uint32" },
    { name: "valueScaled", type: "int256" },
  ],
};

async function submitReading(
  pool: any,
  oracleSigner: any,
  chainId: bigint,
  country: string,
  year: number,
  valueScaled: bigint
) {
  const signature = await oracleSigner.signTypedData(
    {
      name: "HighTideOracle",
      version: "1",
      chainId,
      verifyingContract: await pool.getAddress(),
    },
    READING_TYPES,
    { country, year, valueScaled }
  );
  return pool.submitReading(country, year, valueScaled, signature);
}

export async function run(scenario: string) {
  const dep = loadDeployments();
  const [owner, oracle, donor] = await ethers.getSigners();
  const chainId = BigInt(network.config.chainId ?? 31337);
  const pool = poolContract(dep, owner);
  const token = tokenContract(dep, owner);
  const poolOracle = poolContract(dep, oracle);
  const TV = "0x5456";

  if (scenario === "fund") {
    const amount = ethers.parseEther("10000000");
    await (await token.mint(donor.address, amount)).wait();
    await (
      await token.connect(donor).approve(dep.pool, amount)
    ).wait();
    await (await pool.connect(donor).fund(amount)).wait();
    console.log(`Funded pool with 10,000,000 HTD`);
    console.log(`Pool balance: ${ethers.formatEther(await token.balanceOf(dep.pool))} HTD`);
    return;
  }

  if (scenario === "lanina") {
    // Replay Tuvalu's documented La Nina-window readings (real data)
    const years = [2020, 2021, 2022];
    const series = seaLevelSeries("Tuvalu").filter((p) => years.includes(p.year));
    console.log(`Replaying Tuvalu ${years.join("/")} (oracle: ${dep.oracle})`);
    for (const point of series) {
      const tx = await submitReading(
        poolOracle, oracle, chainId, TV, point.year, toScaled(point.value)
      );
      const receipt = await tx.wait();
      const triggered = receipt.logs
        .map((log: any) => { try { return pool.interface.parseLog(log); } catch { return null; } })
        .filter((e: any) => e && e.name === "Triggered");
      const paid = receipt.logs
        .map((log: any) => { try { return pool.interface.parseLog(log); } catch { return null; } })
        .filter((e: any) => e && e.name === "PayoutExecuted");
      for (const e of triggered) {
        console.log(
          `  TRIGGERED ${e.args.country} ${Number(e.args.startYear)}-${Number(e.args.endYear)} ` +
          `peakZ=${Number(e.args.peakZScaled) / 1e6} tier=${Number(e.args.tierScaled) / 1e6}`
        );
      }
      for (const e of paid) {
        console.log(
          `  PAID ${ethers.formatEther(e.args.paid)} HTD to ${e.args.beneficiary} ` +
          `(outstanding ${ethers.formatEther(e.args.outstanding)})`
        );
      }
      if (triggered.length === 0) {
        console.log(`  ${point.year}: reading accepted, no trigger`);
      }
    }
    const beneficiary = dep.beneficiaries["TV"];
    console.log(
      `Tuvalu beneficiary balance: ${ethers.formatEther(await token.balanceOf(beneficiary))} HTD`
    );
    return;
  }

  if (scenario === "attack") {
    // The double-count attack: resubmit Tuvalu 2022 (already evaluated)
    const point = seaLevelSeries("Tuvalu").find((p) => p.year === 2022)!;
    try {
      await submitReading(
        poolOracle, oracle, chainId, TV, 2022, toScaled(point.value)
      );
      console.log("UNEXPECTED: replay attack went through - PROTOCOL FAILURE");
      process.exitCode = 1;
    } catch (err: any) {
      const reverted = String(err?.shortMessage ?? err?.message ?? err);
      if (reverted.includes("ReadingAlreadyEvaluated")) {
        console.log("ATTACK BLOCKED: contract reverted with ReadingAlreadyEvaluated");
        console.log("The same extreme event can never be paid twice.");
      } else {
        throw err;
      }
    }
    return;
  }

  console.log(`Unknown scenario "${scenario}" - use fund | lanina | attack`);
}
