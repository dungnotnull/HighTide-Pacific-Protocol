import riskAllocation from "@/data/protocol/risk_allocation.json";
import { Cite } from "@/components/ui/Cite";

interface CountryRisk {
  iso2: string;
  name: string;
  trend_mm_yr: number;
  exceedance_prob: number;
  risk_index: number;
  allocation_weight: number;
}

// Sort once at module load: largest pool share first
const countries = (Object.values(riskAllocation.countries) as CountryRisk[]).sort(
  (a, b) => b.allocation_weight - a.allocation_weight
);

const maxWeight = Math.max(...countries.map((c) => c.allocation_weight));

// Long official names shortened for narrow table cells (mirrors EmittersContrastBar)
const shortNames: Record<string, string> = {
  "Federated States of Micronesia": "Micronesia",
  "Republic of Marshall Islands": "Marshall Is.",
};

export function RiskAllocation() {
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-foam/10 bg-foam/[0.03]">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-foam/15">
              <th className="px-4 py-2.5 font-data text-[11px] font-medium uppercase tracking-wider text-foam/50">
                Country
              </th>
              <th className="px-4 py-2.5 text-right font-data text-[11px] font-medium uppercase tracking-wider text-foam/50">
                Trend (mm/yr)
              </th>
              <th className="px-4 py-2.5 text-right font-data text-[11px] font-medium uppercase tracking-wider text-foam/50">
                Acute exceedance
              </th>
              <th className="px-4 py-2.5 text-right font-data text-[11px] font-medium uppercase tracking-wider text-foam/50">
                Risk index
              </th>
              <th className="px-4 py-2.5 font-data text-[11px] font-medium uppercase tracking-wider text-foam/50">
                Allocation weight
              </th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr
                key={c.iso2}
                className="border-b border-foam/[0.06] last:border-b-0 transition-colors hover:bg-foam/[0.04]"
              >
                <td className="px-4 py-2.5 text-sm text-foam/90">
                  {shortNames[c.name] ?? c.name}
                  <span className="ml-2 font-data text-[10px] text-foam/40">{c.iso2}</span>
                </td>
                <td className="px-4 py-2.5 text-right font-data text-[13px] text-foam/80">
                  {c.trend_mm_yr.toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-right font-data text-[13px] text-foam/80">
                  {(c.exceedance_prob * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-2.5 text-right font-data text-[13px] text-foam/80">
                  {c.risk_index.toFixed(2)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 w-full min-w-[60px] max-w-[140px] overflow-hidden rounded-full bg-foam/10">
                      <div
                        className="h-full rounded-full bg-coral/80"
                        style={{ width: `${(c.allocation_weight / maxWeight) * 100}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-data text-[13px] text-foam/90">
                      {(c.allocation_weight * 100).toFixed(2)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-data text-[11px] leading-relaxed text-foam/40">
        Method: {riskAllocation.method}
      </p>
      <Cite ids={["WB-CCKP", "WIDLANSKY-2015", "OWID-CO2", "GCB", "PCRIC"]} />
    </div>
  );
}
