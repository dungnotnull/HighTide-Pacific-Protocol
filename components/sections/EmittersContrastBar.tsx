"use client";

import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { useDimensions } from "@/hooks/useDimensions";
import { ghgData, tempAnomalyData } from "@/lib/data";

interface EmittersContrastBarProps {
  active: boolean;
  onCountryClick?: (countryName: string, countryCode: string) => void;
  selectedYear?: number;
}

export function EmittersContrastBar({ active, onCountryClick, selectedYear = 2024 }: EmittersContrastBarProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width } = useDimensions(wrapRef);

  // Build merged GHG + Temp data for selected year, sorted DESC by GHG
  const data = useMemo(() => {
    return ghgData
      .map((g) => {
        // Get GHG value for selected year (fallback to latest)
        let ghgValue = g.latest_value;
        if (g.series) {
          const pt = g.series.find((s) => s.year === selectedYear);
          if (pt) ghgValue = pt.value;
          else {
            // Nearest year fallback
            const nearest = g.series.reduce((prev, curr) =>
              Math.abs(curr.year - selectedYear) < Math.abs(prev.year - selectedYear) ? curr : prev
            );
            ghgValue = nearest.value;
          }
        }

        // Get Temp value for selected year
        const t = tempAnomalyData.find((tc) => tc.code === g.code);
        let tempValue: number | null = null;
        if (t && t.series) {
          const pt = t.series.find((s) => s.year === selectedYear);
          if (pt) tempValue = pt.value;
          else if (t.series.length > 0) {
            const nearest = t.series.reduce((prev, curr) =>
              Math.abs(curr.year - selectedYear) < Math.abs(prev.year - selectedYear) ? curr : prev
            );
            tempValue = nearest.value;
          }
        }

        return {
          code: g.code,
          name: g.name,
          ghg: ghgValue,
          temp: tempValue,
        };
      })
      .sort((a, b) => b.ghg - a.ghg); // Sort DESC by GHG
  }, [selectedYear]);

  useEffect(() => {
    if (!svgRef.current || width === 0 || data.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 8, right: 56, bottom: 4, left: 164 };
    const w = width - margin.left - margin.right;
    const barH = 16;
    const tempBarH = 12;
    const rowGap = 10;
    const innerGap = 3; // gap between GHG bar and Temp bar
    const rowH = barH + innerGap + tempBarH + rowGap;

    // GHG scale (coral, left)
    const maxGhg = d3.max(data, (d) => d.ghg) ?? 1;
    const xGhg = d3.scaleLinear().domain([0, maxGhg * 1.1]).range([0, w]);

    // Temp scale (lagoon, right) — separate scale for temp anomaly
    const tempVals = data.map((d) => d.temp ?? 0);
    const tempExtent = d3.extent(tempVals) as [number, number];
    const tempMax = Math.max(Math.abs(tempExtent[0] ?? 0), Math.abs(tempExtent[1] ?? 1)) * 1.2;
    const xTemp = d3.scaleLinear().domain([0, tempMax]).range([0, w * 0.85]);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const rows = g
      .selectAll("g.row")
      .data(data)
      .join("g")
      .attr("class", "row")
      .attr("transform", (_, i) => `translate(0,${i * rowH})`)
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        if (onCountryClick) onCountryClick(d.name, d.code);
      })
      .on("mouseover", function () {
        d3.select(this).selectAll("rect").attr("opacity", 0.75);
      })
      .on("mouseout", function () {
        d3.select(this).selectAll("rect").attr("opacity", 1);
      });

    // Country name label
    rows
      .append("foreignObject")
      .attr("x", -margin.left + 2)
      .attr("y", 0)
      .attr("width", margin.left - 6)
      .attr("height", rowH - rowGap)
      .append("xhtml:div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "flex-end")
      .style("height", "100%")
      .style("font-family", "'Public Sans', ui-sans-serif, system-ui, sans-serif")
      .style("font-size", "10.5px")
      .style("color", "rgba(14,42,44,0.8)")
      .style("text-align", "right")
      .style("line-height", "1.2")
      .text((d) => {
        const name = d.name;
        // Short names
        const shorts: Record<string, string> = {
          "Federated States of Micronesia": "Micronesia",
          "Republic of Marshall Islands": "Marshall Is.",
        };
        return shorts[name] ?? name;
      });

    // GHG bar (top)
    rows
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", barH)
      .attr("rx", 2)
      .attr("width", 0)
      .attr("fill", "var(--coral)")
      .transition()
      .duration(active ? 800 : 0)
      .delay((_, i) => (active ? i * 50 : 0))
      .attr("width", (d) => xGhg(d.ghg));

    // GHG value label
    rows
      .append("text")
      .attr("x", (d) => xGhg(d.ghg) + 5)
      .attr("y", barH / 2)
      .attr("dy", "0.35em")
      .attr("font-family", "'Public Sans', ui-sans-serif, system-ui, sans-serif")
      .attr("font-size", 9.5)
      .attr("fill", "var(--coral)")
      .text((d) => `${d.ghg.toFixed(1)} Tons`);

    // Temp bar (bottom)
    rows
      .append("rect")
      .attr("x", 0)
      .attr("y", barH + innerGap)
      .attr("height", tempBarH)
      .attr("rx", 2)
      .attr("width", 0)
      .attr("fill", "var(--lagoon)")
      .attr("fill-opacity", 0.75)
      .transition()
      .duration(active ? 800 : 0)
      .delay((_, i) => (active ? i * 50 + 200 : 0))
      .attr("width", (d) => (d.temp !== null ? xTemp(Math.abs(d.temp)) : 0));

    // Temp value label
    rows
      .append("text")
      .attr("x", (d) => (d.temp !== null ? xTemp(Math.abs(d.temp)) + 5 : 5))
      .attr("y", barH + innerGap + tempBarH / 2)
      .attr("dy", "0.35em")
      .attr("font-family", "'Public Sans', ui-sans-serif, system-ui, sans-serif")
      .attr("font-size", 9.5)
      .attr("fill", "var(--lagoon)")
      .text((d) => (d.temp !== null ? `${d.temp > 0 ? "+" : ""}${d.temp.toFixed(2)}°C` : "—"));

  }, [width, active, selectedYear, data]);

  const chartH = data.length * (16 + 3 + 12 + 10) + 16;

  return (
    <div ref={wrapRef} className="w-full">
      {/* Scale note */}
      <div className="flex items-center gap-4 mb-2 text-xs text-ink">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm" style={{ background: "var(--coral)" }} />
          GHG per capita (Tons)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm opacity-75" style={{ background: "var(--lagoon)" }} />
          Temperature anomaly (°C)
        </span>
      </div>
      <svg ref={svgRef} width={width} height={chartH} />
    </div>
  );
}
