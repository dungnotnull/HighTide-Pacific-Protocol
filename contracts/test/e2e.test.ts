import { expect } from "chai";
import fs from "node:fs";
import path from "node:path";
import { ethers, network } from "hardhat";
import { deployPoolFixture, signReading } from "./helpers";

const REPO = path.join(__dirname, "..", "..");
const triggerParams = JSON.parse(
  fs.readFileSync(path.join(REPO, "data", "protocol", "trigger_params.json"), "utf8")
);
const riskAllocation = JSON.parse(
  fs.readFileSync(path.join(REPO, "data", "protocol", "risk_allocation.json"), "utf8")
);
const backtest = JSON.parse(
  fs.readFileSync(path.join(REPO, "data", "protocol", "backtest_report.json"), "utf8")
);
const seaLevel = JSON.parse(
  fs.readFileSync(path.join(REPO, "data", "sea_level.json"), "utf8")
);

function toScaled(v: number): bigint {
  return BigInt(Math.round(v * 1_000_000));
}

describe("E2E: full protocol against the Python backtest", () => {
  it("configures all 13 countries, funds once, replays TV+WS real series, matches the backtest, and blocks the attack", async () => {
    const { pool, token, owner, oracle, donor } = await deployPoolFixture();

    // 1. configure every country exactly as the deploy script does
    for (const [code, c] of Object.entries<any>(triggerParams.countries)) {
      const weight = riskAllocation.countries[code].allocation_weight;
      await pool.connect(owner).setCountry(
        "0x" + Buffer.from(code, "ascii").toString("hex"),
        c.name,
        BigInt(c.intercept_scaled),
        BigInt(c.slope_scaled),
        BigInt(c.sigma_scaled),
        BigInt(Math.round(triggerParams.k * 1_000_000)),
        c.n_consecutive,
        BigInt(Math.round(weight * 1_000_000)),
        ethers.Wallet.createRandom().address
      );
    }
    expect(
      Object.keys(triggerParams.countries).length
    ).to.equal(13);

    // 2. fund the pool.
    // The backtest entitlements assume a 10,000,000 HTD reference pool, but the
    // combined TV+WS entitlements (5,092,128 + 6,992,172 = 12,084,300) exceed a
    // single 10M funding, so the last payout would be partially paid through the
    // contract's shortfall (outstanding) path. Fund 20M to keep every payout
    // whole; referencePool stays 10M so entitlement math still matches the
    // Python backtest exactly.
    const referencePool = ethers.parseEther("10000000");
    const fundedAmount = ethers.parseEther("20000000");
    await token.mint(donor.address, fundedAmount);
    await token.connect(donor).approve(await pool.getAddress(), fundedAmount);
    await pool.connect(donor).fund(fundedAmount);

    // 3. replay the real series for Tuvalu and Samoa over the backtest's
    // evaluation window (2015-2025). The backtest never scores 2005-2014
    // (that is its calibration window), so in-sample years like WS 2011
    // (z ~ 2.03) must not be replayed or the contract would legitimately
    // fire events the backtest has no record of.
    const chainId = network.config.chainId ?? 31337;
    const nameByCode: Record<string, string> = {
      TV: "Tuvalu",
      WS: "Samoa",
    };
    for (const [code, name] of Object.entries(nameByCode)) {
      const hex = "0x" + Buffer.from(code, "ascii").toString("hex");
      const series = seaLevel[name].series.filter(
        (p: any) => p.year >= 2015 && p.year <= 2025
      );
      for (const point of series) {
        const sig = await signReading(
          oracle, await pool.getAddress(), chainId, hex,
          point.year, toScaled(point.value)
        );
        await pool.submitReading(hex, point.year, toScaled(point.value), sig);
      }
    }

    // 4. total payouts match the Python backtest for both countries
    const expectedFor = (code: string) =>
      backtest.events
        .filter((e: any) => e.iso2 === code)
        .reduce(
          (sum: bigint, e: any) =>
            sum +
            (referencePool *
              BigInt(Math.round(e.tier_payout_fraction * 1e6)) /
              1_000_000n) *
              BigInt(Math.round(riskAllocation.countries[code].allocation_weight * 1e6)) /
              1_000_000n,
          0n
        );

    expect(await pool.totalPaidByCountry("0x5456")).to.equal(expectedFor("TV"));
    expect(await pool.totalPaidByCountry("0x5753")).to.equal(expectedFor("WS"));

    const triggeredCount = (await pool.queryFilter(pool.filters.Triggered())).length;
    expect(triggeredCount).to.equal(
      backtest.events.filter(
        (e: any) => e.iso2 === "TV" || e.iso2 === "WS"
      ).length
    );

    // 5. the double-count attack is blocked for both countries
    for (const [code, name] of Object.entries(nameByCode)) {
      const hex = "0x" + Buffer.from(code, "ascii").toString("hex");
      const point = seaLevel[name].series.find((p: any) => p.year === 2022)!;
      const sig = await signReading(
        oracle, await pool.getAddress(), chainId, hex,
        2022, toScaled(point.value)
      );
      await expect(
        pool.submitReading(hex, 2022, toScaled(point.value), sig)
      ).to.be.revertedWithCustomError(pool, "ReadingAlreadyEvaluated");
    }
  });
});
