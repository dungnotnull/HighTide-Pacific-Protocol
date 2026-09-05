"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { cleanWaterFull, TARGET_PICS, shortName } from "@/lib/data";
import { SourceNote } from "@/components/ui/SourceNote";
import Flag from "@/components/ui/Flag";
import * as d3 from "d3";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TimelineControl } from "@/components/ui/TimelineControl";

// Dynamically import react-plotly factory to avoid heavy plotly.js and SSR issues
const Plot = dynamic(() => 
  import("react-plotly.js/factory").then((mod) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Plotly = require("plotly.js-dist-min");
    return mod.default(Plotly);
  }), 
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-ink/5 rounded-lg border border-ink/10 min-h-[120px]">
        <div className="flex flex-col items-center gap-2 opacity-50">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-ink-dim">Processing data...</span>
        </div>
      </div>
    )
  }
);

const INDICATORS = {
  water: "SH_H2O_SAFE",
  defecation: "SH_SAN_DEFECT",
  handwashing: "SH_SAN_HNDWSH",
};

// Colors for countries in the legend/scatter
const COUNTRY_COLORS = [
  "#dc2626", // strong red
  "#2563eb", // strong blue
  "#16a34a", // green
  "#ea580c", // orange
  "#9333ea", // purple
  "#0891b2", // cyan
  "#e11d48", // rose
  "#d97706", // amber
  "#0d9488", // teal
  "#65a30d", // lime
  "#4f46e5", // indigo
  "#0284c7", // light blue
  "#c026d3", // fuchsia
];

export default function WashTriangleDashboard() {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Lazy loading state
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" } 
    );
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Extract valid years (2016 to 2024)
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    Object.values(INDICATORS).forEach((id) => {
      cleanWaterFull[id]?.years.forEach((y) => {
        if (y >= 2016 && y <= 2024) years.add(y);
      });
    });
    return Array.from(years).sort();
  }, []);

  // Helper to get exact value for the year
  const getExactValue = (countryName: string, indicatorId: string, targetYear: number) => {
    const cData = cleanWaterFull[indicatorId]?.countries[countryName];
    if (!cData || !cData.total || cData.total.length === 0) return null;
    const pt = cData.total.find((d) => d.year === targetYear);
    return pt ? pt.value : null;
  };

  // Compile data for the selected year
  const dataMap = useMemo(() => {
    const map = new Map();
    TARGET_PICS.forEach((country) => {
      const water = getExactValue(country, INDICATORS.water, selectedYear);
      const defecation = getExactValue(country, INDICATORS.defecation, selectedYear);
      const handwashing = getExactValue(country, INDICATORS.handwashing, selectedYear);

      // Only include countries that have all three metrics to keep the 3D space, legend, and 2D charts consistent
      if (water !== null && defecation !== null && handwashing !== null) {
        map.set(country, { water, defecation, handwashing });
      }
    });
    return map;
  }, [selectedYear]);

  const activeCountries = Array.from(dataMap.keys()).sort();

  // Compute Stats per indicator for all TARGET_PICS (not just activeCountries in 3D plot)
  const indicatorStats = useMemo(() => {
    const stats = {
      water: { values: [] as { country: string, value: number }[] },
      defecation: { values: [] as { country: string, value: number }[] },
      handwashing: { values: [] as { country: string, value: number }[] },
    };

    TARGET_PICS.forEach((country) => {
      const water = getExactValue(country, INDICATORS.water, selectedYear);
      if (water !== null) stats.water.values.push({ country, value: water });

      const defecation = getExactValue(country, INDICATORS.defecation, selectedYear);
      if (defecation !== null) stats.defecation.values.push({ country, value: defecation });

      const handwashing = getExactValue(country, INDICATORS.handwashing, selectedYear);
      if (handwashing !== null) stats.handwashing.values.push({ country, value: handwashing });
    });

    const getExtremesAndAvg = (arr: { country: string, value: number }[]) => {
      if (arr.length === 0) return { avg: 0, high: { country: null as string | null, value: null as number | null }, low: { country: null as string | null, value: null as number | null }, n: 0 };
      const avg = d3.mean(arr, d => d.value) || 0;
      let maxVal = -Infinity;
      let minVal = Infinity;
      let maxCountry = null;
      let minCountry = null;

      arr.forEach(d => {
        if (d.value > maxVal) { maxVal = d.value; maxCountry = d.country; }
        if (d.value < minVal) { minVal = d.value; minCountry = d.country; }
      });

      return {
        avg,
        high: { country: maxCountry, value: maxVal },
        low: { country: minCountry, value: minVal },
        n: arr.length
      };
    };

    return {
      water: getExtremesAndAvg(stats.water.values),
      defecation: getExtremesAndAvg(stats.defecation.values),
      handwashing: getExtremesAndAvg(stats.handwashing.values),
    };
  }, [selectedYear]);



  // 3D Chart Data formatting
  const plotData3D = useMemo(() => {
    return activeCountries.map((c, i) => {
      const d = dataMap.get(c);
      const isHovered = hoveredCountry === c;
      const isOtherHovered = hoveredCountry !== null && hoveredCountry !== c;
      
      const size = isHovered ? 14 : 8;
      const opacity = isOtherHovered ? 0.3 : 0.85;
      const color = COUNTRY_COLORS[i % COUNTRY_COLORS.length];

      return {
        type: "scatter3d",
        mode: isOtherHovered ? "markers" : "markers+text",
        name: shortName(c),
        x: [d.defecation],
        y: [d.water],
        z: [d.handwashing],
        text: [shortName(c)],
        textposition: "top center",
        textfont: {
          family: "inherit",
          size: 11
        },
        marker: {
          size: size,
          color: color,
          opacity: opacity,
          line: { width: 0 }
        },
        hoverinfo: "text",
        hovertext: `${shortName(c)}<br>Water: ${d.water?.toFixed(1)}%<br>Defecation: ${d.defecation?.toFixed(1)}%<br>Handwashing: ${d.handwashing?.toFixed(1)}%`,
        showlegend: false,
      };
    });
  }, [dataMap, activeCountries, hoveredCountry]);

  const plotLayout3D = {
    margin: { l: 0, r: 0, b: 0, t: 0 },
    font: { family: "'Public Sans', ui-sans-serif, system-ui, sans-serif", color: "var(--ink)", size: 11 },
    paper_bgcolor: "transparent",
    hoverlabel: {
      bgcolor: "rgba(255, 255, 255, 0.95)",
      bordercolor: "rgba(14, 42, 44, 0.1)",
      font: { color: "#0e2a2c", family: "inherit", size: 12 },
    },
    scene: {
      xaxis: { 
        title: { text: "Open defecation (%)", font: { color: "#ea580c", size: 12 } }, 
        range: [0, 50], backgroundcolor: "transparent", showbackground: false,
        color: "#ea580c", gridcolor: "rgba(0,0,0,0.05)", showgrid: true, showline: true, linewidth: 1, linecolor: "#ea580c", zeroline: false,
        tickfont: { size: 11 }
      },
      yaxis: { 
        title: { text: "Safely managed drinking water (%)", font: { color: "#2563eb", size: 12 } }, 
        range: [0, 100], backgroundcolor: "transparent", showbackground: false,
        color: "#2563eb", gridcolor: "rgba(0,0,0,0.05)", showgrid: true, showline: true, linewidth: 1, linecolor: "#2563eb", zeroline: false,
        tickfont: { size: 11 }
      },
      zaxis: { 
        title: { text: "Handwashing facilities (%)", font: { color: "#2c7a79", size: 12 } }, 
        range: [0, 100], backgroundcolor: "transparent", showbackground: false,
        color: "#2c7a79", gridcolor: "rgba(0,0,0,0.05)", showgrid: true, showline: true, linewidth: 1, linecolor: "#2c7a79", zeroline: false,
        tickfont: { size: 11 }
      },
      camera: {
        eye: { x: 1.85, y: 1.85, z: 0.2 }, // Zoom in slightly, tilted up
      },
    },
    hovermode: "closest",
  };

  // Removed renderPairwiseScatter

  return (
    <section className="relative mb-0" ref={containerRef}>
      <div className="mx-auto max-w-6xl px-0">
        {/* Header */}
        <div className="flex flex-col mb-6 relative">
          <h2 className="font-display text-2xl sm:text-3xl text-ink max-w-3xl">
            Averages hide the gaps: How WASH access differs across PICs
          </h2>
          <div className="mt-3 max-w-3xl text-sm sm:text-base text-ink-dim leading-relaxed space-y-3">
            <p>
              In particular, based on the data available, in 2024, about 44%
              of Pacific Islanders had access to safely managed drinking water
              (WATER), 7.8% practiced open defecation (SANITATION), and 76.4%
              had access to a handwashing facility with soap and water
              (HYGIENE).
            </p>
            <p>
              One figure worth noting is that more than 45% of the population
              in the Solomon Islands practices open defecation, meaning that
              they defecate in the open - in fields, forests, bushes, open
              bodies of water, on beaches, in other open spaces or dispose of
              it with solid waste. Clearly, this shows that nearly half of
              Solomon Islanders lack access to basic sanitation services.
            </p>
            <p>
              Meanwhile, among the countries with data for all three WASH
              indicators, Fiji and Samoa perform well above the Pacific
              average.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 bg-white/60 rounded-md border border-ink/10 shadow-sm overflow-hidden mb-0 text-sm divide-y md:divide-y-0 md:divide-x divide-ink/10">
          
          {/* Water Column */}
          <div className="p-3">
            <h4 className="font-semibold text-blue-600 uppercase tracking-wide">Safely Managed Drinking Water</h4>
            {/* <p className="text-blue-500/80 mb-5 text-[13px]">(% of population)</p> */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-ink font-medium flex items-center gap-1.5">Average <span className="text-ink/70 text-[11px] font-semibold">(n={indicatorStats.water.n})</span></span> 
                <span className="font-medium text-ink bg-ink/5 px-2 py-0.5 rounded border border-ink/10">Pacific ({indicatorStats.water.avg.toFixed(1)}%)</span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-ink/80 font-medium text-[12px] flex items-center gap-1">
                  <svg className="w-3 h-3 text-ink/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  Highest
                </span>
                <span className="text-ink bg-ink/5 border border-ink/10 px-2 py-0.5 rounded-md text-[12px] font-bold">{shortName(indicatorStats.water.high.country || "N/A")} ({indicatorStats.water.high.value?.toFixed(1) ?? "-"}%)</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-ink/80 font-medium text-[12px] flex items-center gap-1">
                  <svg className="w-3 h-3 text-ink/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  Lowest
                </span>
                <span className="text-ink bg-ink/5 border border-ink/10 px-2 py-0.5 rounded-md text-[12px] font-bold">{shortName(indicatorStats.water.low.country || "N/A")} ({indicatorStats.water.low.value?.toFixed(1) ?? "-"}%)</span>
              </div>
            </div>
          </div>

          {/* Defecation Column */}
          <div className="p-3">
            <h4 className="font-semibold text-orange-600 uppercase tracking-wide">Open Defecation</h4>
            {/* <p className="text-orange-500/80 mb-5 text-[13px]">lower is better</p> */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-ink font-medium flex items-center gap-1.5">Average <span className="text-ink/70 text-[11px] font-semibold">(n={indicatorStats.defecation.n})</span></span> 
                <span className="font-medium text-ink bg-ink/5 px-2 py-0.5 rounded border border-ink/10">Pacific ({indicatorStats.defecation.avg.toFixed(1)}%)</span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-ink/80 font-medium text-[12px] flex items-center gap-1">
                  <svg className="w-3 h-3 text-ink/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  Lowest
                </span>
                <span className="text-ink bg-ink/5 border border-ink/10 px-2 py-0.5 rounded-md text-[12px] font-bold">{shortName(indicatorStats.defecation.low.country || "N/A")} ({indicatorStats.defecation.low.value?.toFixed(1) ?? "-"}%)</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-ink/80 font-medium text-[12px] flex items-center gap-1">
                  <svg className="w-3 h-3 text-ink/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  Highest
                </span>
                <span className="text-ink bg-ink/5 border border-ink/10 px-2 py-0.5 rounded-md text-[12px] font-bold">{shortName(indicatorStats.defecation.high.country || "N/A")} ({indicatorStats.defecation.high.value?.toFixed(1) ?? "-"}%)</span>
              </div>
            </div>
          </div>

          {/* Handwashing Column */}
          <div className="p-3">
            <h4 className="font-semibold text-lagoon uppercase tracking-wide">Handwashing Facilities</h4>
            {/* <p className="text-emerald-500/80 mb-5 text-[13px]">(% of population)</p> */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-ink font-medium flex items-center gap-1.5">Average <span className="text-ink/70 text-[11px] font-semibold">(n={indicatorStats.handwashing.n})</span></span> 
                <span className="font-medium text-ink bg-ink/5 px-2 py-0.5 rounded border border-ink/10">Pacific ({indicatorStats.handwashing.avg.toFixed(1)}%)</span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-ink/80 font-medium text-[12px] flex items-center gap-1">
                  <svg className="w-3 h-3 text-ink/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  Highest
                </span>
                <span className="text-ink bg-ink/5 border border-ink/10 px-2 py-0.5 rounded-md text-[12px] font-bold">{shortName(indicatorStats.handwashing.high.country || "N/A")} ({indicatorStats.handwashing.high.value?.toFixed(1) ?? "-"}%)</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-ink/80 font-medium text-[12px] flex items-center gap-1">
                  <svg className="w-3 h-3 text-ink/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  Lowest
                </span>
                <span className="text-ink bg-ink/5 border border-ink/10 px-2 py-0.5 rounded-md text-[12px] font-bold">{shortName(indicatorStats.handwashing.low.country || "N/A")} ({indicatorStats.handwashing.low.value?.toFixed(1) ?? "-"}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 mb-8 pt-4 md:pt-1">
          <div className="flex-1 lg:flex-[3] relative flex flex-col min-w-0" style={{ minHeight: "620px" }}>
            
            <div className="w-full z-20 mb-2">
              <TimelineControl
                minYear={Math.min(...availableYears)}
                maxYear={Math.max(...availableYears)}
                currentYear={selectedYear}
                onYearChange={setSelectedYear}
                trackClassName="min-w-[500px] md:min-w-[600px]"
              />
            </div>

            <p className="text-[11px] text-ink/40 font-medium pl-4 z-10">Drag to rotate • Scroll to zoom</p>

            {hoveredCountry && dataMap.get(hoveredCountry) && (
              <div className="absolute top-12 left-4 bg-white/95 backdrop-blur p-4 rounded-lg shadow-lg border border-ink/10 z-30 max-w-[200px] pointer-events-none">
                <h4 className="font-bold text-ink mb-2 border-b border-ink/10 pb-2">{hoveredCountry}</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between gap-4"><span className="text-ink/60">Water:</span> <span className="font-semibold text-blue-600">{dataMap.get(hoveredCountry).water?.toFixed(1)}%</span></div>
                  <div className="flex justify-between gap-4"><span className="text-ink/60">Defecation:</span> <span className="font-semibold text-orange-600">{dataMap.get(hoveredCountry).defecation?.toFixed(1)}%</span></div>
                  <div className="flex justify-between gap-4"><span className="text-ink/60">Handwashing:</span> <span className="font-semibold text-emerald-600">{dataMap.get(hoveredCountry).handwashing?.toFixed(1)}%</span></div>
                </div>
              </div>
            )}
            
            <div className="flex-1 w-full relative mt-6">
              {/* @ts-ignore */}
              {inView && (
                <Plot
                  data={plotData3D as any}
                  layout={plotLayout3D as any}
                  config={{ displayModeBar: false }}
                  style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
                  useResizeHandler={true}
                />
              )}
            </div>
          </div>

          {/* Right Sidebar (Legend) */}
          <div className="lg:w-64 shrink-0 flex flex-col gap-6 md:mt-6">
            <div className="bg-transparent border-l border-ink/10 pl-5 flex-1">
              <div className="flex flex-col gap-1 max-h-[450px] overflow-y-auto custom-scroll pr-2">
                {activeCountries.map((c, i) => (
                  <div
                    key={c}
                    className={`flex items-center gap-2.5 p-1.5 rounded cursor-pointer transition-colors ${hoveredCountry === c ? "bg-ink/5" : "hover:bg-ink/5"}`}
                    onMouseEnter={() => setHoveredCountry(c)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}></div>
                    <Flag iso2={cleanWaterFull[INDICATORS.water].countries[c]?.iso2 || "un"} className="w-4 h-3 shadow-sm opacity-90" />
                    <span className="text-xs font-medium text-ink">{shortName(c)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
         <div className="mt-10 md:mt-4">
                  <SourceNote>
                    <span>Data source: Clean Water and Sanitation (</span>
                    <a
                      href="https://stats.pacificdata.org/vis?locale=en&dataflow%5BdatasourceId%5D=SPC2&dataflow%5BagencyId%5D=SPC&dataflow%5BdataflowId%5D=DF_SDG_06&dataflow%5Bversion%5D=3.0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-primary"
                    >
                      Pacific Data Hub
                    </a>
                    <span>).</span>
                  </SourceNote>
                </div>
                <ScrollReveal animation="fade-up" delay={600}>
                  <p className="mt-3 max-w-2xl text-xs sm:text-sm text-ink-dim leading-relaxed opacity-[0.7]">
                    Closer to the top-front-right corner is better (High
                    safely managed drinking water - Low open defecation - High
                    handwashing facilities).
                  </p>
                </ScrollReveal>
      </div>
    </section>
  );
}
