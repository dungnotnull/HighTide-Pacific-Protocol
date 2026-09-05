"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { GhgCountry, TempCountry } from "@/types";
import { useDimensions } from "@/hooks/useDimensions";
import ghgRaw from "@/data/ghg_per_capita.json";
import tempRaw from "@/data/temperature_anomaly.json";
import picCountriesRaw from "@/data/pic_countries.json";
import { ghgData, tempAnomalyData, picCoords, seaLevelData } from "@/lib/data";
import countriesTopo from "@/data/countries-50m.json";

const ghg = ghgData;
const temp = tempAnomalyData;

type Merged = {
  code: string;
  name: string;
  lat: number;
  lon: number;
  ghg: number;
  tempAnomaly: number | null;
  seaLevel: number | null;
  isOutlier: boolean;
};

const OUTLIERS = new Set(["PW"]); // Palau had unusually high historical data

// Merge GHG data with accurate PIC coordinates
const merged: Merged[] = ghg.map((g) => {
  const picCoord = picCoords.find((p) => p.code === g.code);
  const t = temp.find((t) => t.code === g.code);

  // Use accurate coordinates from picCountries if available, otherwise fallback to ghgData
  const lat = picCoord?.lat ?? g.lat;
  const lon = picCoord?.lon ?? g.lon;
  const name = picCoord?.name ?? g.name;

  const slName = name === 'Micronesia' || name === 'Federated States of Micronesia' 
    ? 'Micronesia, Federated State of' 
    : name === 'Republic of Marshall Islands' ? 'Marshall Islands' : name;
  const sl = (seaLevelData as any)[slName] ?? (seaLevelData as any)[name];
  const latestSl = sl && sl.series && sl.series.length > 0 ? sl.series[sl.series.length - 1].value : null;

  return {
    code: g.code,
    name: name,
    lat: lat,
    lon: lon,
    ghg: g.latest_value,
    tempAnomaly: t ? t.latest_value : null,
    seaLevel: latestSl,
    isOutlier: OUTLIERS.has(g.code),
  };
});

type Tooltip = { x: number; y: number; d: Merged } | null;

interface CauseMapProps {
  active: boolean;
  selectedYear?: number;
}

export function CauseMap({ active, selectedYear = 2024 }: CauseMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = useDimensions(wrapRef);
  const [tooltip, setTooltip] = useState<Tooltip>(null);

  // Get year-specific data
  const getYearData = useMemo(() => {
    return (code: string, year: number) => {
      const g = ghg.find((c) => c.code === code);
      const t = temp.find((c) => c.code === code);

      let ghgValue = g?.latest_value ?? 0;
      let tempValue = t?.latest_value ?? null;

      // Try to find year-specific data
      if (g && g.series) {
        const yearData = g.series.find((s) => s.year === year);
        if (yearData) ghgValue = yearData.value;
      }

      if (t && t.decades) {
        const decade = Math.floor(year / 10) * 10;
        const decadeData = t.decades.find((d) => d.decade === decade);
        if (decadeData) tempValue = decadeData.value;
      }

      let slValue = null;
      const slName = g?.name === 'Micronesia' || g?.name === 'Federated States of Micronesia' 
        ? 'Micronesia, Federated State of' 
        : g?.name === 'Republic of Marshall Islands' ? 'Marshall Islands' : (g?.name ?? '');
      const sl = slName ? ((seaLevelData as any)[slName] ?? (seaLevelData as any)[g?.name ?? '']) : null;
      if (sl && sl.series) {
        // Find closest year or exact year
        const slData = sl.series.find((s: any) => s.year === year);
        if (slData) slValue = slData.value;
      }

      return { ghg: ghgValue, temp: tempValue, seaLevel: slValue };
    };
  }, []);

  // Create merged data for specific year
  const yearMerged = useMemo(() => {
    return ghg.map((g) => {
      const picCoord = picCoords.find((p) => p.code === g.code);
      const lat = picCoord?.lat ?? g.lat;
      const lon = picCoord?.lon ?? g.lon;
      const name = picCoord?.name ?? g.name;
      const yearData = getYearData(g.code, selectedYear);

      return {
        code: g.code,
        name: name,
        lat: lat,
        lon: lon,
        ghg: yearData.ghg,
        tempAnomaly: yearData.temp,
        seaLevel: yearData.seaLevel,
        isOutlier: OUTLIERS.has(g.code),
      };
    });
  }, [selectedYear, getYearData]);

  const land = useMemo(() => {
    const obj = (countriesTopo as any).objects.countries;
    return topojson.feature(countriesTopo as any, obj) as any;
  }, []);

  useEffect(() => {
    if (!svgRef.current || width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const projection = d3
      .geoEqualEarth()
      .rotate([160, 0])
      .center([0, -15])
      .translate([width / 2, height / 2])
      .scale(width < 480 ? width / 2.2 : width / 2.8);

    const path = d3.geoPath(projection as any);

    svg
      .append("g")
      .attr("class", "land")
      .selectAll("path")
      .data((land as any).features)
      .join("path")
      .attr("d", path as any)
      .attr("fill", "rgba(142,161,157,0.18)")
      .attr("stroke", "rgba(142,161,157,0.28)")
      .attr("stroke-width", 0.6);

    const rMax = width < 480 ? 20 : 32;
    const radius = d3
      .scaleSqrt()
      .domain([0, d3.max(yearMerged, (d) => d.ghg) ?? 10])
      .range([4, rMax])
      .clamp(true);

    // Symmetrical fixed domain (-1.2 to 1.2) so cool is always teal and warm is always red
    // 1.2 is roughly the max temp anomaly in the dataset
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

    const gMarks = svg.append("g").attr("class", "marks");

    const nodes = gMarks
      .selectAll("g.node")
      .data(yearMerged)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => {
        const p = projection([d.lon, d.lat]);
        return p ? `translate(${p[0]},${p[1]})` : "translate(-100,-100)";
      })
      .style("cursor", "pointer");

    nodes
      .append("circle")
      .attr("r", 0)
      .attr("fill", (d) => color(d.tempAnomaly ?? 0))
      .attr("fill-opacity", 0.82)
      .attr("stroke", (d) => (d.isOutlier ? "var(--gold)" : "rgba(14,42,44,0.35)"))
      .attr("stroke-width", (d) => (d.isOutlier ? 1.6 : 0.8))
      .attr("stroke-dasharray", (d) => (d.isOutlier ? "2,2" : "none"))
      .transition()
      .delay((_, i) => i * 25)
      .duration(700)
      .ease(d3.easeBackOut)
      .attr("r", (d) => radius(Math.min(d.ghg, 20)));

    // Outer ring for Sea Level
    nodes
      .append("circle")
      .attr("r", 0)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6") // blue-500
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", (d) => d.seaLevel !== null ? 0.6 : 0)
      .transition()
      .delay((_, i) => i * 25 + 300)
      .duration(700)
      .ease(d3.easeBackOut)
      .attr("r", (d) => {
        const baseR = radius(Math.min(d.ghg, 20));
        // map seaLevel (-0.2 to 0.3) to extra radius (0 to 12)
        const extraR = d.seaLevel !== null ? Math.max(2, (d.seaLevel + 0.2) * 20) : 0;
        return baseR + extraR;
      });

    nodes
      .on("mousemove", (event, d) => {
        const [x, y] = d3.pointer(event, wrapRef.current);
        setTooltip({ x, y, d });
      })
      .on("mouseleave", () => setTooltip(null));

    // small labels for a few recognizable anchor countries
    const labeled = new Set(["FJ", "PG", "SB", "VU", "TO", "KI", "TV", "PW"]);
    gMarks
      .selectAll("text.label")
      .data(merged.filter((d) => labeled.has(d.code)))
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => {
        const p = projection([d.lon, d.lat]);
        return p ? p[0] + radius(Math.min(d.ghg, 20)) + 6 : 0;
      })
      .attr("y", (d) => {
        const p = projection([d.lon, d.lat]);
        return p ? p[1] + 3 : 0;
      })
      .attr("font-family", "'Public Sans', ui-sans-serif, system-ui, sans-serif")
      .attr("font-size", 10.5)
      .attr("fill", "rgba(14,42,44,0.55)")
      .attr("opacity", 0)
      .text((d) => d.name)
      .transition()
      .delay(600)
      .duration(500)
      .attr("opacity", 1);
  }, [width, height, yearMerged, selectedYear]);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <svg ref={svgRef} width={width} height={height} />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[220px] rounded-md border border-ink/10 bg-foam px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">{tooltip.d.name}</p>
            <p className="text-ink/50">{selectedYear}</p>
          </div>
          <p className="stat-figure mt-1 text-ink/70">
            {tooltip.d.ghg.toFixed(1)} Tons
            {tooltip.d.isOutlier && (
              <span className="ml-1 text-gold">· see note</span>
            )}
          </p>
          {tooltip.d.tempAnomaly !== null && (
            <p className="stat-figure text-ink/70">
              {tooltip.d.tempAnomaly > 0 ? "+" : ""}
              {tooltip.d.tempAnomaly.toFixed(1)}°C vs. baseline
            </p>
          )}
          {tooltip.d.seaLevel !== null && (
            <p className="stat-figure text-[#3b82f6]">
              {tooltip.d.seaLevel > 0 ? "+" : ""}
              {(tooltip.d.seaLevel).toFixed(3)} mm sea level
            </p>
          )}
        </div>
      )}
    </div>
  );
}
