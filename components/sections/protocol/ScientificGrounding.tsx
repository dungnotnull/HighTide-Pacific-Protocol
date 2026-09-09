"use client";

import { Cite } from "@/components/ui/Cite";

export function ScientificGrounding() {
  return (
    <div className="w-full mt-14 rounded-xl bg-ink/40 border border-lagoon/30 p-6 md:p-8 shadow-xl">
      <h3 className="font-display text-xl text-lagoon-soft sm:text-2xl mb-6 border-b border-lagoon/20 pb-4">
        Climate Justice: The Carbon & Sea-Level Link
      </h3>
      
      <div className="grid gap-8 md:grid-cols-2 text-sm leading-relaxed text-foam/80">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral/20 text-coral font-data text-xs">01</div>
            <h4 className="font-display text-lg text-foam">Who Pays? (The Carbon Debt)</h4>
          </div>
          <p className="pl-11">
            HighTide is <strong>not</strong> a carbon offset market. It is a strict Loss & Damage fund. The liquidity pool is funded based on historical greenhouse gas (GHG) emissions. The largest industrial nations bear the greatest <span className="font-bold text-coral-soft">Carbon Debt</span>, meaning they contribute the lion's share of the pool. <strong>Carbon is the metric for liability.</strong>
          </p>
          <div className="mt-3 pl-11">
             <Cite ids={["OWID-CO2", "GCB", "COP28-1CP28"]} />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lagoon/30 text-lagoon-soft font-data text-xs">02</div>
            <h4 className="font-display text-lg text-foam">Who Gets Paid? (The Sea-Level Trigger)</h4>
          </div>
          <p className="pl-11">
            Pacific Island Countries emit the least but suffer the most. Our AI engine uses rigorous <em>Ordinary Least Squares (OLS)</em> forecasting with 80%/95% Prediction Intervals to model acute sea-level anomalies (driven by ENSO phenomena like La Niña). When the sea level spikes and destroys WASH infrastructure, the Smart Contract automatically triggers a payout. <strong>Sea-level is the metric for vulnerability.</strong>
          </p>
          <div className="mt-3 pl-11">
             <Cite ids={["FPP3", "IPCC6-CH9", "WIDLANSKY-2014", "NIST-PI"]} />
          </div>
        </div>
      </div>
    </div>
  );
}
