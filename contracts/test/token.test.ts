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
