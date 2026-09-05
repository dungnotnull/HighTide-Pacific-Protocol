import baseSepolia from "@/data/deployments-baseSepolia.json";
import localhost from "@/data/deployments-localhost.json";

export type Deployments = {
  network: string;
  chainId?: number;
  token: string;
  registry: string;
  pool: string;
  oracle: string;
  beneficiaries: Record<string, string>;
  abi: { pool: string; registry: string; token: string };
};

const SEPOLIA = baseSepolia as unknown as Deployments;
const LOCAL = localhost as unknown as Deployments;

export function getDeployments(): Deployments {
  // Testnet first; fall back to the local demo deployment
  if (SEPOLIA?.pool?.startsWith("0x")) return SEPOLIA;
  return LOCAL;
}

export const EXPLORER: Record<string, string | null> = {
  baseSepolia: "https://sepolia.basescan.org",
  localhost: null,
};
