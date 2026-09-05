"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { YearValue } from "@/types";
import { useDimensions } from "@/hooks/useDimensions";
import tempAvg from "@/data/temperature_pacific_avg.json";

import { ghgLatestYear } from "@/lib/data";

const rawData = tempAvg as YearValue[];
// Match the Map's MIN_YEAR and MAX_YEAR
const MIN_YEAR = 2005;
const data = rawData.filter((d) => d.year >= MIN_YEAR && d.year <= ghgLatestYear);

export function WarmingStripes() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = useDimensions(wrapRef);

  useEffect(() => {
    if (!svgRef.current || width === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const x = d3
      .scaleBand()
      .domain(data.map((d) => String(d.year)))
      .range([0, width])
      .padding(0);

    const extent = d3.extent(data, (d) => d.value) as [number, number];
    // Use same fixed symmetrical domain as CauseMap for absolute consistency
    const color = d3
      .scaleSequential(d3.interpolateRgbBasis([
        "#313695", // -1.2
        "#74add1", // -0.8
        "#e0f3f8", // -0.4
        "#ffffbf", // 0.0
        "#fdae61", // +0.4
        "#f46d43", // +0.8
        "#d73027"  // +1.2
      ]))
      .domain([-1.2, 1.2]);

    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(String(d.year))!)
      .attr("y", 0)
      .attr("width", Math.max(1, x.bandwidth()))
      .attr("height", height)
      .attr("fill", (d) => color(d.value))
      .append("title")
      .text((d) => `${d.year}: ${d.value > 0 ? "+" : ""}${d.value.toFixed(2)}°C`);
  }, [width, height]);

  const first = data[0];
  const last = data[data.length - 1];

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-ink/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#313695]"></span> Cooler
        </span>
        <span className="uppercase tracking-widest text-[10px] font-semibold text-ink/50">
          Regional warming, 2005–2024
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#d73027]"></span> Warmer
        </span>
      </div>
      <div ref={wrapRef} className="h-8 w-full overflow-hidden rounded-sm">
        <svg ref={svgRef} width={width} height={32} />
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="text-[10px] text-ink/65">{first.year}</span>
        <span className="text-[10px] text-ink/65">{last.year}</span>
      </div>
    </div>
  );
}