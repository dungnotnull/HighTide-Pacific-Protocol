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

    for (const point of series) {
      const sig = await signReading(
        oracle, await pool.getAddress(), chainId, TV,
        point.year, toScaled(point.value)
      );
      await pool.submitReading(TV, point.year, toScaled(point.value), sig);
    }

    // all submissions are mined; query Triggered events deterministically
    // (a live .on() listener is not guaranteed to flush before assertions)
    const triggerEvents = await pool.queryFilter(pool.filters.Triggered());
    const fired = triggerEvents.map((e) => ({
      startYear: e.args.startYear,
      endYear: e.args.endYear,
      peakZ: e.args.peakZScaled,
      tier: e.args.tierScaled,
    }));

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
