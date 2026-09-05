"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { YearValue, SeaLevelCountry } from "@/types";
import { useDimensions } from "@/hooks/useDimensions";
import seaLevelAvg from "@/data/sea_level_pacific_avg.json";
import { seaLevelData as seaLevelCountries } from "@/lib/data";

const HIGHLIGHT_CODE = "TV"; // Tuvalu - the emblematic low-lying atoll nation
// Convert the country dictionary to an array of SeaLevelCountry
const countries = Object.entries(seaLevelCountries).map(([name, data]) => ({
  code: data.iso2,
  name,
  lat: 0,
  lon: 0,
  series: data.series,
})) as SeaLevelCountry[];
const avg = seaLevelAvg as YearValue[];

export function SeaLevelScrolly({ step }: { step: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = useDimensions(wrapRef);

  // ---- draw (runs once per size change / data - not per step) -----------
  useEffect(() => {
    if (!svgRef.current || width === 0) return;
    const margin = { top: 28, right: 65, bottom: 28, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const years = avg.map((d) => d.year);
    const x = d3
      .scaleLinear()
      .domain([d3.min(years)!, d3.max(years)!])
      .range([0, w]);

    const allValues = countries.flatMap((c) => c.series.map((s) => s.value));
    const y = d3
      .scaleLinear()
      .domain([d3.min(allValues)! - 0.05, d3.max(allValues)! + 0.05])
      .nice()
      .range([h, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // axes
    const xAxis = d3
      .axisBottom(x)
      .ticks(width < 480 ? 4 : 7)
      .tickFormat(d3.format("d"))
      .tickSizeOuter(0);
    const yAxis = d3
      .axisLeft(y)
      .ticks(5)
      .tickFormat((d) => `${d}m`)
      .tickSizeOuter(0);

    g.append("g")
      .attr("class", "axis-x")
      .attr("transform", `translate(0,${h})`)
      .call(xAxis)
      .call((sel) => sel.select(".domain").attr("stroke", "rgba(238,242,238,0.25)"))
      .selectAll("text")
      .attr("fill", "rgba(238,242,238,0.55)")
      .attr("font-family", "var(--font-data)")
      .attr("font-size", 11);

    g.append("g")
      .attr("class", "axis-y")
      .call(yAxis)
      .call((sel) => sel.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "rgba(238,242,238,0.55)")
      .attr("font-family", "var(--font-data)")
      .attr("font-size", 11);

    g.selectAll(".axis-y .tick line")
      .attr("stroke", "rgba(238,242,238,0.08)")
      .attr("x2", w);

    const line = d3
      .line<YearValue>()
      .x((d) => x(d.year))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    // faint spaghetti lines for every PICT
    g.append("g")
      .attr("class", "spaghetti")
      .selectAll("path")
      .data(countries.filter((c) => c.code !== HIGHLIGHT_CODE))
      .join("path")
      .attr("d", (d) => line(d.series))
      .attr("fill", "none")
      .attr("stroke", "rgba(188,216,211,0.18)")
      .attr("stroke-width", 1);

    // highlighted country (Tuvalu) - drawn but revealed via stroke-dashoffset in step effect
    const twData = countries.find((c) => c.code === HIGHLIGHT_CODE);
    if (twData) {
      const path = g
        .append("path")
        .attr("class", "highlight-line")
        .attr("d", line(twData.series))
        .attr("fill", "none")
        .attr("stroke", "var(--coral)")
        .attr("stroke-width", 2.25);
      const len = (path.node() as SVGPathElement).getTotalLength();
      path
        .attr("stroke-dasharray", `${len} ${len}`)
        .attr("stroke-dashoffset", len)
        .attr("data-length", len);
    }

    // Pacific-wide unweighted average - bold line
    const avgPath = g
      .append("path")
      .attr("class", "avg-line")
      .attr("d", line(avg))
      .attr("fill", "none")
      .attr("stroke", "var(--foam)")
      .attr("stroke-width", 2.5);
    const avgLen = (avgPath.node() as SVGPathElement).getTotalLength();
    avgPath
      .attr("stroke-dasharray", `${avgLen} ${avgLen}`)
      .attr("stroke-dashoffset", avgLen)
      .attr("data-length", avgLen);

    // end-of-line labels
    const lastAvg = avg[avg.length - 1];
    const avgY = y(lastAvg.value);
    const avgX = x(lastAvg.year);

    // Position label: check if it would overflow on the right
    // Estimate label width ~70px for "Pacific avg."
    const labelWidth = 70;
    const wouldOverflowRight = avgX + 8 + labelWidth > w + 20; // +20 for some padding

    const avgLabelX = wouldOverflowRight ? avgX - labelWidth - 8 : avgX + 8;
    const avgLabelAnchor = wouldOverflowRight ? "end" : "start";

    // Position label above if too close to bottom
    const avgLabelY = avgY > h * 0.85 ? avgY - 14 : avgY - 4;

    g.append("text")
      .attr("class", "avg-label")
      .attr("x", avgLabelX)
      .attr("y", avgLabelY)
      .attr("dy", "0.35em")
      .attr("text-anchor", avgLabelAnchor)
      .attr("fill", "var(--foam)")
      .attr("font-family", "var(--font-data)")
      .attr("font-size", 11)
      .attr("opacity", 0)
      .text("Pacific avg.");

    if (twData) {
      const lastTv = twData.series[twData.series.length - 1];
      const tvX = x(lastTv.year);
      const tvLabelWidth = 45; // Approximate width for "Tuvalu"
      const tvWouldOverflowRight = tvX + 8 + tvLabelWidth > w + 20;

      const tvLabelX = tvWouldOverflowRight ? tvX - tvLabelWidth - 8 : tvX + 8;
      const tvLabelAnchor = tvWouldOverflowRight ? "end" : "start";

      g.append("text")
        .attr("class", "tv-label")
        .attr("x", tvLabelX)
        .attr("y", y(lastTv.value) - 10)
        .attr("text-anchor", tvLabelAnchor)
        .attr("fill", "var(--coral)")
        .attr("font-family", "var(--font-data)")
        .attr("font-size", 11)
        .attr("opacity", 0)
        .text("Tuvalu");
    }
  }, [width, height]);

  // ---- step-driven reveal (paired apply/revert, mirrors reference idiom) -
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const t = d3.transition().duration(900).ease(d3.easeCubicOut);

    function drawLine(sel: d3.Selection<SVGPathElement, unknown, null, undefined>) {
      const len = +sel.attr("data-length");
      sel.transition(t as never).attr("stroke-dashoffset", 0);
      return len;
    }
    function hideLine(sel: d3.Selection<SVGPathElement, unknown, null, undefined>) {
      const len = +sel.attr("data-length");
      sel.transition(t as never).attr("stroke-dashoffset", len);
    }

    const avgLine = svg.select<SVGPathElement>(".avg-line");
    const avgLabel = svg.select(".avg-label");
    const twLine = svg.select<SVGPathElement>(".highlight-line");
    const twLabel = svg.select(".tv-label");

    if (step >= 0) {
      if (!avgLine.empty()) drawLine(avgLine);
      avgLabel.transition(t as never).attr("opacity", 1);
    } else {
      if (!avgLine.empty()) hideLine(avgLine);
      avgLabel.transition(t as never).attr("opacity", 0);
    }

    if (step >= 1) {
      if (!twLine.empty()) drawLine(twLine);
      twLabel.transition(t as never).attr("opacity", 1);
    } else {
      if (!twLine.empty()) hideLine(twLine);
      twLabel.transition(t as never).attr("opacity", 0);
    }
  }, [step]);

  return (
    <div ref={wrapRef} className="h-full w-full">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
    </div>
  );
}