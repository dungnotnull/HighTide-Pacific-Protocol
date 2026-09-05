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

  it("rejects zero nConsecutive and zero k", async () => {
    const { pool, owner, other } = await deploy();
    await expect(
      pool.connect(owner).setCountry(
        "0x5456", "Tuvalu", tvParams.interceptScaled, tvParams.slopeScaled,
        tvParams.sigmaScaled, tvParams.kScaled, 0, tvParams.weightScaled,
        other.address
      )
    ).to.be.revertedWithCustomError(pool, "ZeroNConsecutive");

    await expect(
      pool.connect(owner).setCountry(
        "0x5456", "Tuvalu", tvParams.interceptScaled, tvParams.slopeScaled,
        tvParams.sigmaScaled, 0n, 1, tvParams.weightScaled,
        other.address
      )
    ).to.be.revertedWithCustomError(pool, "ZeroK");
  });
});
