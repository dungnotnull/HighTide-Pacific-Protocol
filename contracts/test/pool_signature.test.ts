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
