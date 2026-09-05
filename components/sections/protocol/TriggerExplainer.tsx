import triggerParams from "@/data/protocol/trigger_params.json";
import riskAllocation from "@/data/protocol/risk_allocation.json";
import { Cite } from "@/components/ui/Cite";

// Worked example computed from the committed trigger parameters so the
// displayed numbers always match the data the contracts use.
const tv = triggerParams.countries.TV;
const k = tv.k;
const nConsecutive = tv.n_consecutive;

interface Allocation {
  iso2: string;
  allocation_weight: number;
}

const tvAllocation = (Object.values(riskAllocation.countries) as Allocation[]).find(
  (c) => c.iso2 === "TV"
);

const EXAMPLE_YEAR = 2022;
const EXAMPLE_READING = 1.4678; // observed PDH reading (m), matches backtest 2022 event
const MOCK_POOL_USD = 10_000_000;

const expected = tv.intercept + tv.slope * EXAMPLE_YEAR;
const z = (EXAMPLE_READING - expected) / tv.sigma;
const tier = z >= 3 ? 1.0 : z >= 2 ? 0.6 : z >= 1 ? 0.3 : 0;
const payoutUsd = Math.round((tvAllocation?.allocation_weight ?? 0) * tier * MOCK_POOL_USD);

const tiers = [
  { label: "z \u2265 3\u03c3", fraction: "100%" },
  { label: "z \u2265 2\u03c3", fraction: "60%" },
  { label: "z \u2265 1\u03c3", fraction: "30%" },
];

export function TriggerExplainer() {
  return (
    <div className="w-full">
      <div className="rounded-lg border border-foam/10 bg-foam/[0.03] p-5">
        <h3 className="font-display text-xl text-foam sm:text-2xl">
          When does a payout fire?
        </h3>
        <pre className="mt-4 overflow-x-auto rounded-md border border-foam/10 bg-ocean-deep/60 p-4 font-mono text-[12px] leading-relaxed text-foam/85">
{`threshold(year) = intercept + slope\u00b7year + k\u00b7\u03c3
trigger when z \u2265 k for ${nConsecutive} consecutive reading${nConsecutive > 1 ? "s" : ""}`}
        </pre>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {tiers.map((t) => (
            <span key={t.label} className="font-mono text-[12px] text-foam/70">
              <span className="text-foam/90">{t.label}</span> &rarr;{" "}
              <span className="text-coral">{t.fraction}</span> of the
              country&rsquo;s allocation
            </span>
          ))}
        </div>
        <pre className="mt-4 overflow-x-auto rounded-md border border-foam/10 bg-ocean-deep/60 p-4 font-mono text-[12px] leading-relaxed text-foam/85">
{`Tuvalu, ${EXAMPLE_YEAR} \u2014 worked example
intercept = ${tv.intercept.toFixed(4)}   slope = ${tv.slope.toFixed(4)}   \u03c3 = ${tv.sigma.toFixed(4)}   k = ${k}   N = ${nConsecutive}

reading     = ${EXAMPLE_READING.toFixed(4)} m
expected    = ${tv.intercept.toFixed(4)} + ${tv.slope.toFixed(4)}\u00b7${EXAMPLE_YEAR} = ${expected.toFixed(4)}
z           = (${EXAMPLE_READING.toFixed(4)} \u2212 ${expected.toFixed(4)}) / ${tv.sigma.toFixed(4)} = ${z.toFixed(2)}

z \u2265 3\u03c3 \u2192 tier 100% \u2192 payout ${((tvAllocation?.allocation_weight ?? 0) * 100).toFixed(2)}% \u00d7 $${(MOCK_POOL_USD / 1e6).toFixed(0)}M`}
        </pre>
        <p className="mt-3 font-mono text-[13px] text-foam/90">
          Payout: <span className="text-coral">${payoutUsd.toLocaleString("en-US")}</span>
        </p>
      </div>
      <Cite ids={["IPCC6-CH9", "MERRIFIELD-2011", "WIDLANSKY-2014", "NIST-PI", "FPP3"]} />
    </div>
  );
}
