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
