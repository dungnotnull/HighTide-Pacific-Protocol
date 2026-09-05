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
