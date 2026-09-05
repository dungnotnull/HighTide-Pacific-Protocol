"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { getDeployments, EXPLORER, type Deployments } from "@/lib/deployments";
import { Cite } from "@/components/ui/Cite";

type PayoutRow = {
  key: string;
  country: string;
  paid: string;
  txHash: string;
  blockNumber: number;
};

type ChainState = {
  networkName: string;
  explorer: string | null;
  poolAddress: string;
  tokenAddress: string;
  poolBalance: string | null;
  totalPaid: string | null;
  payouts: PayoutRow[];
  errors: string[];
};

function formatHtd(wei: bigint): string {
  return Number(ethers.formatEther(wei)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

// Reverse lookup: beneficiary wallet address -> country name
function countryForAddress(deployments: Deployments, address: string): string {
  const normalized = address.toLowerCase();
  for (const [code, wallet] of Object.entries(deployments.beneficiaries)) {
    if (wallet.toLowerCase() === normalized) return code;
  }
  return "unknown";
}

async function readChain(provider: ethers.JsonRpcProvider, deployments: Deployments): Promise<ChainState> {
  const explorer = EXPLORER[deployments.network] ?? null;
  const errors: string[] = [];

  // ABI strings in the deployments file; parse defensively
  const tokenAbi = JSON.parse(deployments.abi.token);
  const poolAbi = JSON.parse(deployments.abi.pool);
  const token = new ethers.Contract(deployments.token, tokenAbi, provider);
  const pool = new ethers.Contract(deployments.pool, poolAbi, provider);

  let poolBalance: string | null = null;
  let totalPaid: string | null = null;
  let payouts: PayoutRow[] = [];

  try {
    const balance: bigint = await token.balanceOf(deployments.pool);
    poolBalance = formatHtd(balance);
  } catch {
    errors.push("Pool balance unavailable");
  }

  try {
    const events = await pool.queryFilter(pool.filters.PayoutExecuted());
    let paidSum = 0n;
    for (const ev of events) {
      paidSum += (ev as ethers.EventLog).args.paid as bigint;
    }
    totalPaid = formatHtd(paidSum);

    payouts = events
      .slice(-8)
      .reverse()
      .map((ev, i) => {
        const log = ev as ethers.EventLog;
        return {
          key: `${log.transactionHash}-${log.index ?? i}`,
          country: countryForAddress(deployments, log.args.beneficiary as string),
          paid: formatHtd(log.args.paid as bigint),
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        };
      });
  } catch {
    errors.push("Payout history unavailable");
  }

  return {
    networkName: deployments.network === "localhost" ? "Local node" : "Base Sepolia testnet",
    explorer,
    poolAddress: deployments.pool,
    tokenAddress: deployments.token,
    poolBalance,
    totalPaid,
    payouts,
    errors,
  };
}

export function LiveProtocol() {
  const deployments = useRef<Deployments>(getDeployments());
  const [state, setState] = useState<ChainState | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const d = deployments.current;
    if (!d?.pool?.startsWith("0x")) {
      setFatal("Contracts not deployed to this network yet");
      setState(null);
      setLoading(false);
      return;
    }
    const rpcUrl = d.network === "localhost" ? "http://127.0.0.1:8545" : "https://sepolia.base.org";
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const next = await readChain(provider, d);
      setState(next);
      setFatal(null);
    } catch {
      setFatal("Could not reach the network. Contracts not deployed to this network yet.");
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const explorer = state?.explorer ?? null;
  const degraded = fatal !== null;

  return (
    <div className="w-full rounded-lg border border-foam/10 bg-foam/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-coral/40 bg-coral/10 px-2.5 py-0.5 font-data text-[11px] uppercase tracking-wider text-coral">
            <span className="h-1.5 w-1.5 rounded-full bg-coral animate-pulse" />
            Live
          </span>
          <span className="font-data text-[11px] uppercase tracking-wider text-foam/50">
            {state?.networkName ?? deployments.current.network}
          </span>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="rounded-full border border-foam/25 px-3 py-1 font-data text-[11px] uppercase tracking-wider text-foam/70 transition-colors hover:border-foam/50 hover:text-foam disabled:opacity-50"
        >
          {loading ? "Reading..." : "Refresh"}
        </button>
      </div>

      {degraded ? (
        <p className="mt-4 text-sm text-foam/60">{fatal}</p>
      ) : state ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-foam/10 bg-ink/40 p-3">
              <p className="font-data text-[11px] uppercase tracking-wider text-foam/50">Pool balance</p>
              <p className="mt-1 font-data text-xl text-coral">
                {state.poolBalance !== null ? `${state.poolBalance} HTD` : "unavailable"}
              </p>
            </div>
            <div className="rounded-md border border-foam/10 bg-ink/40 p-3">
              <p className="font-data text-[11px] uppercase tracking-wider text-foam/50">Total paid</p>
              <p className="mt-1 font-data text-xl text-coral">
                {state.totalPaid !== null ? `${state.totalPaid} HTD` : "unavailable"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-data text-[11px] text-foam/50">
            {explorer ? (
              <>
                <a
                  href={`${explorer}/address/${state.poolAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-foam/30 underline-offset-2 transition-colors hover:text-foam"
                >
                  Pool contract
                </a>
                <a
                  href={`${explorer}/address/${state.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-foam/30 underline-offset-2 transition-colors hover:text-foam"
                >
                  HTD token
                </a>
              </>
            ) : (
              <span>
                pool <span className="font-mono">{shortHash(state.poolAddress)}</span>
              </span>
            )}
          </div>

          <p className="mt-5 font-data text-[11px] uppercase tracking-wider text-foam/50">Recent payouts</p>
          <div className="mt-2 overflow-x-auto">
            {state.payouts.length === 0 ? (
              <p className="py-3 text-sm text-foam/50">No payouts executed yet.</p>
            ) : (
              <table className="w-full min-w-[520px] border-collapse text-left">
                <tbody>
                  {state.payouts.map((p) => (
                    <tr key={p.key} className="border-b border-foam/[0.06] last:border-b-0">
                      <td className="py-2 pr-4 text-sm text-foam/90">{p.country}</td>
                      <td className="py-2 pr-4 text-right font-mono text-[13px] text-coral">{p.paid} HTD</td>
                      <td className="py-2 pr-4 font-mono text-[11px] text-foam/50">
                        {explorer ? (
                          <a
                            href={`${explorer}/tx/${p.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-foam/30 underline-offset-2 transition-colors hover:text-foam"
                          >
                            {shortHash(p.txHash)}
                          </a>
                        ) : (
                          shortHash(p.txHash)
                        )}
                      </td>
                      <td className="py-2 text-right font-mono text-[11px] text-foam/40">block {p.blockNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {state.errors.length > 0 && (
            <p className="mt-3 font-data text-[11px] text-coral/70">{state.errors.join(" · ")}</p>
          )}
        </>
      ) : null}

      <p className="mt-4 text-[12px] leading-relaxed text-foam/40">
        Test tokens on a public testnet. Oracle replays real historical readings.
      </p>
      <Cite ids={["EIP-712", "CHAINLINK", "GOFFARD-2025", "CONDON-2017"]} />
    </div>
  );
}
