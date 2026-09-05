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
