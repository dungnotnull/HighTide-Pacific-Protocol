"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useDimensions } from "@/hooks/useDimensions";
import { GhgCountry, TempCountry } from "@/types";
import { ghgData as ghg, tempAnomalyData as temp, picCoords, seaLevelData } from "@/lib/data";
import { getIso2 } from "@/lib/flags";
import { createPortal } from "react-dom";
import Flag from "@/components/ui/Flag";

interface CountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryCode: string;
  countryName: string;
}



export function CountryModal({
  isOpen,
  onClose,
  countryCode,
  countryName,
}: CountryModalProps) {
  const countryGhg = ghg.find((c) => c.code === countryCode);
  const countryTemp = temp.find((c) => c.code === countryCode);
  const countryPic = picCoords.find((p) => p.code === countryCode);

  const slName = countryName === 'Micronesia' || countryName === 'Federated States of Micronesia'
    ? 'Micronesia, Federated State of'
    : countryName === 'Republic of Marshall Islands' ? 'Marshall Islands' : countryName;
  const countrySl = (seaLevelData as any)[slName] ?? (seaLevelData as any)[countryName];
  const latestSl = countrySl && countrySl.series && countrySl.series.length > 0
    ? countrySl.series.find((s: any) => s.year === 2024) ?? countrySl.series[countrySl.series.length - 1]
    : null;

  const iso2 = getIso2(countryCode);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-6 sm:px-6"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-ink/10 bg-foam p-6 shadow-2xl"
        style={{
          position: "relative",
          zIndex: 1001,
          margin: "auto",
          maxWidth: "48rem",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {iso2 && <Flag iso2={iso2} className="w-16 h-auto shrink-0" />}
            <div>
              <h3 className="text-2xl font-medium text-ink">
                {countryName}
              </h3>
              <p className="mt-1 text-sm text-ink/60">
                {countryCode}
                {countryPic && (
                  <span className="ml-2">
                    · {countryPic.lat.toFixed(2)}°N, {countryPic.lon.toFixed(2)}
                    °E
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink/60 hover:bg-ink/5"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Current Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-ink/8 bg-white/40 p-4">
            <p className="eyebrow text-ink/60">GHG Per Capita (2024)</p>
            <p className="mt-2 text-3xl font-medium text-coral">
              {countryGhg?.latest_value
                ? countryGhg.latest_value.toFixed(1)
                : "N/A"}
              <span className="ml-1 text-lg text-ink/50">Tons</span>
            </p>
          </div>
          <div className="rounded-xl border border-ink/8 bg-white/40 p-4">
            <p className="eyebrow text-ink/60">Temp Anomaly (2024)</p>
            <p className="mt-2 text-3xl font-medium text-lagoon">
              {(() => {
                const temp2024 = countryTemp?.series?.find((s) => s.year === 2024);
                const val = temp2024 !== undefined ? temp2024.value : countryTemp?.latest_value;
                if (val !== undefined && val !== null) {
                  return (val > 0 ? "+" : "") + val.toFixed(1) + "°C";
                }
                return "N/A";
              })()}
            </p>
          </div>
          <div className="rounded-xl border border-ink/8 bg-white/40 p-4">
            <p className="eyebrow text-ink/60">Sea Level (2024)</p>
            <p className="mt-2 text-3xl font-medium text-[#3b82f6]">
              {latestSl !== null
                ? (latestSl.value > 0 ? "+" : "") +
                  (latestSl.value).toFixed(3) +
                  "mm"
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Historical Chart - Combined */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-ink/70">
            GHG, Temperature & Sea Level (2005–2024)
          </p>
          <CombinedChart countryCode={countryCode} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Combined Chart Component - Shows both CO2 and Temp on same chart
function CombinedChart({ countryCode }: { countryCode: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = useDimensions(wrapRef);

  useEffect(() => {
    if (!svgRef.current || width === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const countryGhg = ghg.find((c) => c.code === countryCode);
    const countryTemp = temp.find((c) => c.code === countryCode);
    const countryNameMap = countryGhg?.name || "";
    const slName = countryNameMap === 'Micronesia' ? 'Micronesia, Federated State of' : countryNameMap;
    const countrySl = (seaLevelData as any)[slName];

    const margin = { top: 20, right: 150, bottom: 40, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale - years from 1990 to latest available (dynamic)
    const ghgYears = countryGhg?.series?.map((d) => d.year) ?? [];
    const tempYears = countryTemp?.series?.map((d) => d.year) ?? [];
    const slYears = countrySl?.series?.map((d: any) => d.year) ?? [];
    const allXYears = [...ghgYears, ...tempYears, ...slYears];
    const xMin = 2005;
    const xMax = 2024;
    const x = d3.scaleLinear().domain([xMin, xMax]).range([0, w]);

    // Left Y scale - GHG per capita (0 to max Tons)
    const maxGhg =
      countryGhg && countryGhg.series
        ? d3.max(countryGhg.series.filter((d) => d.year >= xMin), (d) => d.value)! * 1.1
        : 1;
    const yGhg = d3.scaleLinear().domain([0, maxGhg]).range([h, 0]);

    // Right Y scale - Temperature (min to max)
    const allTemp =
      countryTemp && countryTemp.decades
        ? countryTemp.decades.map((d) => d.value)
        : [0, 5];
    const tempExtent = d3.extent(allTemp) as [number, number];
    const yTemp = d3
      .scaleLinear()
      .domain([tempExtent[0] - 0.5, tempExtent[1] + 0.5])
      .range([h, 0]);

    // Right-Right Y scale - Sea Level (min to max)
    const allSl = countrySl && countrySl.series
      ? countrySl.series.map((d: any) => d.value)
      : [-0.2, 0.5];
    const slExtent = d3.extent(allSl) as unknown as [number, number];
    const ySl = d3
      .scaleLinear()
      .domain([(slExtent[0] ?? -0.2) - 0.1, (slExtent[1] ?? 0.5) + 0.2])
      .range([h, 0]);

    // Draw grid lines
    g.append("g")
      .selectAll("line")
      .data(yGhg.ticks(5))
      .join("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", (d) => yGhg(d as number))
      .attr("y2", (d) => yGhg(d as number))
      .attr("stroke", "rgba(14,42,44,0.08)")
      .attr("stroke-width", 1);

    // Draw GHG per capita line
    if (countryGhg && countryGhg.series && countryGhg.series.length > 0) {
      const filteredGhg = countryGhg.series.filter((d) => d.year >= xMin && d.year <= xMax);
      const ghgLine = d3
        .line<(typeof countryGhg.series)[0]>()
        .x((d) => x(d.year))
        .y((d) => yGhg(d.value))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(filteredGhg)
        .attr("d", ghgLine)
        .attr("fill", "none")
        .attr("stroke", "var(--coral)")
        .attr("stroke-width", 2.5);

      // GHG dot at latest year
      const lastGhg = filteredGhg[filteredGhg.length - 1];
      if (lastGhg) {
        g.append("circle")
          .attr("cx", x(lastGhg.year))
          .attr("cy", yGhg(lastGhg.value))
          .attr("r", 4)
          .attr("fill", "var(--coral)")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
      }
    }

    // Draw Temperature line (using yearly series filtered from xMin)
    if (countryTemp && countryTemp.series && countryTemp.series.length > 0) {
      const filteredTemp = countryTemp.series.filter((d) => d.year >= xMin && d.year <= xMax);
      const tempLine = d3
        .line<(typeof countryTemp.series)[0]>()
        .x((d) => x(d.year))
        .y((d) => yTemp(d.value))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(filteredTemp)
        .attr("d", tempLine)
        .attr("fill", "none")
        .attr("stroke", "var(--lagoon)")
        .attr("stroke-width", 2);

      // Temp dot at latest year
      const lastTemp = filteredTemp[filteredTemp.length - 1];
      if (lastTemp) {
        g.append("circle")
          .attr("cx", x(lastTemp.year))
          .attr("cy", yTemp(lastTemp.value))
          .attr("r", 4)
          .attr("fill", "var(--lagoon)")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
      }
    }

    // Draw Sea Level line (filter from xMin)
    if (countrySl && countrySl.series && countrySl.series.length > 0) {
      const filteredSl = countrySl.series.filter((d: any) => d.year >= xMin && d.year <= xMax);
      const slLine = d3
        .line<(typeof countrySl.series)[0]>()
        .x((d) => x(d.year))
        .y((d) => ySl(d.value))
        .curve(d3.curveMonotoneX);

      // Area under sea level line
      const slArea = d3
        .area<(typeof countrySl.series)[0]>()
        .x((d) => x(d.year))
        .y0(h)
        .y1((d) => ySl(d.value))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(filteredSl)
        .attr("d", slArea)
        .attr("fill", "#3b82f6")
        .attr("fill-opacity", 0.1);

      g.append("path")
        .datum(filteredSl)
        .attr("d", slLine)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2);

      // Sea Level dot at latest year
      const lastSl = filteredSl[filteredSl.length - 1];
      if (lastSl) {
        g.append("circle")
          .attr("cx", x(lastSl.year))
          .attr("cy", ySl(lastSl.value))
          .attr("r", 4)
          .attr("fill", "#3b82f6")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
      }
    }

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("font-size", 10)
      .attr("fill", "rgba(14,42,44,0.6)");

    // Left Y axis - CO2
    const yAxisLeft = d3.axisLeft(yGhg).ticks(5);
    g.append("g")
      .call(yAxisLeft)
      .selectAll("text")
      .attr("font-size", 10)
      .attr("fill", "rgba(14,42,44,0.6)");
    g.selectAll(".domain").attr("stroke", "rgba(14,42,44,0.2)");
    g.selectAll(".tick line").attr("stroke", "rgba(14,42,44,0.2)");

    // Right Y axis - Temperature
    const yAxisRight = d3.axisRight(yTemp).ticks(5);
    g.append("g")
      .attr("transform", `translate(${w},0)`)
      .call(yAxisRight)
      .selectAll("text")
      .attr("font-size", 10)
      .attr("fill", "rgba(14,42,44,0.6)");
    g.selectAll(".domain").attr("stroke", "rgba(14,42,44,0.2)");

    // Axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -h / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "var(--coral)")
      .text("GHG (Tons)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", w + 52)
      .attr("x", -h / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "var(--lagoon)")
      .text("Temp Anomaly (°C)");

    // Right-Right Y axis - Sea Level
    const yAxisSl = d3.axisRight(ySl).ticks(5);
    g.append("g")
      .attr("transform", `translate(${w + 80},0)`)
      .call(yAxisSl)
      .selectAll("text")
      .attr("font-size", 10)
      .attr("fill", "#3b82f6");
    g.selectAll(".domain").attr("stroke", "rgba(14,42,44,0.2)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", w + 122)
      .attr("x", -h / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "#3b82f6")
      .text("Sea Level (mm)");

    // Legend
    const legend = g.append("g").attr("transform", `translate(${w - 180}, 10)`);

    legend.append("circle").attr("r", 4).attr("fill", "var(--coral)");

    legend
      .append("text")
      .attr("x", 10)
      .attr("y", 4)
      .attr("font-size", 10)
      .attr("fill", "rgba(14,42,44,0.7)")
      .text("CO₂");

    legend
      .append("circle")
      .attr("cx", 50)
      .attr("r", 4)
      .attr("fill", "var(--lagoon)");

    legend
      .append("text")
      .attr("x", 60)
      .attr("y", 4)
      .attr("font-size", 10)
      .attr("fill", "rgba(14,42,44,0.7)")
      .text("Temp");

    legend
      .append("circle")
      .attr("cx", 105)
      .attr("r", 4)
      .attr("fill", "#3b82f6");

    legend
      .append("text")
      .attr("x", 115)
      .attr("y", 4)
      .attr("font-size", 10)
      .attr("fill", "rgba(14,42,44,0.7)")
      .text("Sea Level");
  }, [width, height, countryCode]);

  return (
    <div ref={wrapRef} className="h-56 w-full">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ fontFamily: 'var(--font-body)' }}
      />
    </div>
  );
}
