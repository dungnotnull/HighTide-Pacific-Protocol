"use client";

import { useMemo, useState } from "react";
import * as d3 from "d3";
import { cleanWaterFull, indicatorIds } from "@/lib/data";
import DotPlotChartOld from "./DotPlotChartOld";
import WashTriangleDashboard from "./WashTriangleDashboard";

const THRESHOLD = 1.0; // percentage points



export default function CompositionPage() {
  const [indicatorId, setIndicatorId] = useState(indicatorIds[0]);
  const indicator = cleanWaterFull[indicatorId];
  const years = indicator.years;
  const [start, setStart] = useState(years[0]);
  const [end, setEnd] = useState(years[years.length - 1]);

  const rows = useMemo(() => {
    return Object.entries(indicator.countries)
      .map(([name, c]) => {
        const v0 = c.total.find((p) => p.year === start)?.value;
        const v1 = c.total.find((p) => p.year === end)?.value;
        if (v0 === undefined || v1 === undefined) return null;
        const delta = v1 - v0;
        const goodDirection = indicator.polarity === "good" ? delta : -delta;
        const category =
          goodDirection > THRESHOLD
            ? "improved"
            : goodDirection < -THRESHOLD
            ? "declined"
            : "stagnant";
        return { name, iso2: c.iso2, v0, v1, delta, category };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [indicator, start, end]);

  const counts = { improved: 0, declined: 0, stagnant: 0 } as Record<string, number>;
  rows.forEach((r) => (counts[r.category] += 1));

  const pieData = (["improved", "stagnant", "declined"] as const).map((k) => ({
    key: k,
    value: counts[k],
  }));

  const R = 145;
  const r0 = 80;
  const pie = d3.pie<{ key: string; value: number }>().value((d) => d.value).sort(null);

  return (
    <div id="composition-section">
      {/* <DotPlotChart /> */}
        <DotPlotChartOld />
        <WashTriangleDashboard />
    </div>
  );
}
