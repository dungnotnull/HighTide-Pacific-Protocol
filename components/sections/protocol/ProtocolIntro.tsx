import { Cite } from "@/components/ui/Cite";

const pillars = [
  {
    step: "01",
    title: "Verified data",
    body: (
      <>
        Satellite altimetry from the Pacific Data Hub sea-level series, processed
        per country. Every reading is hashed and the hash is anchored on-chain,
        so the numbers that fire a payout cannot be edited after the fact.
      </>
    ),
  },
  {
    step: "02",
    title: "AI risk engine",
    body: (
      <>
        A sea-level forecasting model fits a per-country trend with uncertainty,
        assigns each nation a risk weight in the pool, and sets the statistical
        thresholds that decide when a trigger fires.
      </>
    ),
  },
  {
    step: "03",
    title: "Smart contracts",
    body: (
      <>
        EIP-712 signed oracle readings feed a parametric pool on Base: payout
        executes automatically on trigger, from the country&rsquo;s own
        allocation. Each reading is consumed once, so a double count is
        impossible.
      </>
    ),
  },
];

export function ProtocolIntro() {
  return (
    <div className="w-full">
      <h3 className="font-display text-xl text-foam sm:text-2xl">
        How HighTide works
      </h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {pillars.map((p) => (
          <div
            key={p.step}
            className="rounded-lg border border-foam/10 bg-foam/[0.03] p-5"
          >
            <span className="font-data text-[11px] text-coral">{p.step}</span>
            <h4 className="mt-2 font-display text-lg text-foam">{p.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-foam/70">{p.body}</p>
          </div>
        ))}
      </div>
      <Cite ids={["PDH-SEA", "EIP-712", "GOFFARD-2025", "UNFCCC-FRLD"]} />
    </div>
  );
}
