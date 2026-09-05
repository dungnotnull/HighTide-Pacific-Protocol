"use client";

import { useState } from "react";
import * as d3 from "d3";
import { wwdsSnapshot, wwdsYears, shortName } from "@/lib/data";
import Flag from "../ui/Flag";
import IndicatorSubNav from "../ui/IndicatorSubNav";
import CompositionPage from "./composition/page";
import { makePalette } from "@/lib/colors";

export default function IndicatorsHub() {
  const [year, setYear] = useState(wwdsYears[wwdsYears.length - 1]);
  const rows = wwdsSnapshot.filter((r) => r.year === year).sort((a, b) => b.value - a.value);
  const width = 720;
  const rowH = 36;
  const height = rows.length * rowH + 16;
  const x = d3.scaleLinear().domain([0, 100]).range([0, width - 150]);

  // Create color palette for countries
  const countryNames = rows.map((r) => r.name).sort();
  const palette = makePalette(countryNames);

  return (
    <>
      {/* Composition Section */}
      <section className="relative px-6 py-14 md:px-16">
        <CompositionPage />
      </section>

      {/* Supplementary WASH Snapshot */}
      {/* <section className="mx-auto max-w-7xl px-5 sm:px-8 py-10 sm:py-14">
        <h2 className="font-display text-2xl text-ink mb-3">
          Appendix &middot; Safely treated wastewater
        </h2>
        <p className="max-w-2xl text-sm text-ink-dim leading-relaxed mb-5">
          The indicator <span className="font-mono text-ink-dim">EN_WWT_WWDS</span> only
          has sparse data across {wwdsYears.length} years ({wwdsYears.join(", ")}) with different country
          reporting each year — insufficient continuity for a reliable trend chart,
          so we present it as annual snapshots instead of a full animated visualization.
        </p>
        <div className="chart-paper rounded-lg p-5 sm:p-6">
          <div className="flex gap-2 mb-4">
            {wwdsYears.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-4 py-2 rounded-md font-mono text-[12px] font-medium transition-all cursor-pointer border ${
                  year === y ? "bg-brass-bright text-paper border-brass-bright shadow-md hover:shadow-lg" : "text-ink-dim hover:text-ink border-grid hover:border-tide hover:shadow-sm bg-paper"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {rows.map((r, i) => {
              const countryColor = palette.get(r.name) ?? "var(--tide-2)";
              return (
                <g key={r.name} transform={`translate(0,${i * rowH})`}>
                  <foreignObject x={0} y={3} width={140} height={rowH - 6}>
                    <div className="flex items-center gap-2 h-full">
                      <Flag iso2={r.iso2} className="w-5 h-3.5 shrink-0" />
                      <span className="font-mono text-[11px] text-ink truncate font-medium">{shortName(r.name)}</span>
                    </div>
                  </foreignObject>
                  <rect
                    x={150}
                    y={6}
                    width={x(r.value)}
                    height={rowH - 14}
                    fill={countryColor}
                    opacity={0.85}
                    rx={2.5}
                  />
                  <text
                    x={150 + x(r.value) + 8}
                    y={rowH / 2 + 5}
                    fontSize={14}
                    fontFamily="var(--font-mono)"
                    fill={countryColor}
                    fontWeight={600}
                  >
                    {r.value.toFixed(1)}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-12 chart-paper rounded-lg p-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint mb-3">
            Data scope notes
          </h3>
          <p className="text-sm text-ink-dim leading-relaxed">
            Three other indicators (wastewater treatment rate, total wastewater
            generated, total wastewater treated) each have exactly{" "}
            <strong className="text-ink">one data point</strong> (Samoa, 2022) in the
            source dataset — insufficient for country comparison or time series analysis,
            so the team chose not to visualize these indicators rather than force a
            misleading representation.
          </p>
        </div>
      </section> */}
    </>
  );
}
