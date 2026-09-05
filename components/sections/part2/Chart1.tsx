"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import {
  cleanWaterFull,
  indicatorIds,
  getIndicatorLabel,
  shortName,
  YearValue,
} from "@/lib/data";
import { makePalette } from "@/lib/colors";
import YearScrubber from "@/components/ui/YearScrubber";
import Flag from "@/components/ui/Flag";
import { createPortal } from "react-dom";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SourceNote } from "@/components/ui/SourceNote";

const MARGIN = { top: 30, right: 140, bottom: 30, left: 24 };
const ROW_H = 35;

function ModalChart({ series, years, color }: { series: YearValue[], years: number[], color: string }) {
  const w = 500;
  const h = 250;
  const m = { top: 30, right: 30, bottom: 30, left: 60 };
  const innerW = w - m.left - m.right;
  const innerH = h - m.top - m.bottom;

  const xScale = d3.scaleLinear().domain([years[0], years[years.length - 1]]).range([0, innerW]);
  const yExtent = d3.extent(series, d => d.value) as [number, number] || [0, 100];
  const padding = (yExtent[1] - yExtent[0]) * 0.1 || 10;
  const yScale = d3.scaleLinear()
    .domain([Math.max(0, yExtent[0] - padding), Math.min(100, yExtent[1] + padding)])
    .range([innerH, 0]);

  const line = d3.line<YearValue>()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%">
      <g transform={`translate(${m.left},${m.top})`}>
        {/* Axes Base Lines */}
        <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#9CA3AF" strokeWidth={1} />
        <line x1={0} y1={0} x2={0} y2={innerH} stroke="#9CA3AF" strokeWidth={1} />
        
        {/* Grid and Ticks */}
        {yScale.ticks(5).map(t => (
          <g key={t} transform={`translate(0,${yScale(t)})`}>
            <line x1={0} x2={innerW} stroke="#D1D5DB" strokeOpacity={0.6} strokeDasharray="2,2" />
            <line x1={-4} x2={0} stroke="#9CA3AF" strokeWidth={1} />
            <text x={-8} y={4} textAnchor="end" fontSize={11} fill="var(--ink-dim)">{t}%</text>
          </g>
        ))}
        {years.map(y => (
          <g key={y} transform={`translate(${xScale(y)}, 0)`}>
            <line y1={innerH} y2={innerH + 4} stroke="#9CA3AF" strokeWidth={1} />
            <text y={innerH + 20} textAnchor="middle" fontSize={11} fill="var(--ink-dim)">{y}</text>
          </g>
        ))}
        {/* Line */}
        <path d={line(series) || ""} fill="none" stroke={color} strokeWidth={2.5} />
        {/* Points and Values */}
        {series.map(s => (
          <g key={s.year}>
            <circle cx={xScale(s.year)} cy={yScale(s.value)} r={4} fill={color} />
            <text 
              x={xScale(s.year)} 
              y={yScale(s.value) - 10} 
              textAnchor={s.year === years[0] ? "start" : s.year === years[years.length - 1] ? "end" : "middle"} 
              fontSize={10} 
              fill="var(--ink)"
              fontWeight={600}
            >
              {s.value.toFixed(2)}%
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function Part2Chart1() {
  // Use a stable palette across all countries
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    for (const id of indicatorIds) {
      Object.keys(cleanWaterFull[id].countries).forEach(c => set.add(c));
    }
    return Array.from(set).sort();
  }, []);
  const palette = useMemo(() => makePalette(allCountries), [allCountries]);

  const [activeIndicator, setActiveIndicator] = useState(indicatorIds[0]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Block body scroll when modal is open
  useEffect(() => {
    if (selectedCountry) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedCountry]);

  const indicatorDef = cleanWaterFull[activeIndicator];
  const activeCountries = useMemo(() => Object.keys(indicatorDef.countries).sort(), [indicatorDef]);
  const activeYears = indicatorDef.years;

  const [year, setYear] = useState(activeYears[activeYears.length - 1]);
  // Ensure year is valid for new indicator
  useEffect(() => {
    if (!activeYears.includes(year)) {
      setYear(activeYears[activeYears.length - 1]);
    }
  }, [activeIndicator, activeYears, year]);

  const [hover, setHover] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // rank table: rankByYear[year] = ordered list of country names (rank 0 = best)
  const rankByYear = useMemo(() => {
    const table: Record<number, string[]> = {};
    for (const yr of activeYears) {
      const withVal = activeCountries
        .map((name) => {
          const pt = indicatorDef.countries[name].total.find((s) => s.year === yr);
          return { name, value: pt ? pt.value : undefined };
        })
        .map(d => ({
          name: d.name,
          value: d.value ?? (indicatorDef.polarity === "good" ? -Infinity : Infinity)
        }))
        .sort((a, b) => {
          if (indicatorDef.polarity === "good") return b.value - a.value;
          return a.value - b.value;
        });
      table[yr] = withVal.map((d) => d.name);
    }
    return table;
  }, [activeIndicator, activeCountries, activeYears, indicatorDef.polarity]);

  const n = activeCountries.length;
  const height = n * ROW_H + MARGIN.top + MARGIN.bottom;
  const minInnerW = 500;
  const innerW = Math.max(width - MARGIN.left - MARGIN.right, minInnerW);
  const svgWidth = Math.max(width, innerW + MARGIN.left + MARGIN.right);
  const innerH = n * ROW_H;

  const xYear = useMemo(
    () =>
      d3
        .scalePoint<number>()
        .domain(activeYears)
        .range([0, innerW])
        .padding(0.5),
    [innerW, activeYears]
  );

  const yearIdx = activeYears.indexOf(year);

  const rankOf = (name: string, yr: number) => rankByYear[yr].indexOf(name);
  const valueOf = (name: string, yr: number) => indicatorDef.countries[name].total.find((s) => s.year === yr)?.value;

  return (
    <section id="part2-chart1" className="relative bg-foam px-6 py-14 md:px-16">
      <div className="mx-auto max-w-6xl">
         <ScrollReveal animation="fade-down" delay={200}>
          <p className="eyebrow text-lagoon">A Pacific climate story</p>
        </ScrollReveal>
        <h1 className="font-display text-3xl sm:text-4xl text-ink max-w-3xl mt-2">
          Clean Water &amp; Sanitation Rankings
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-ink-dim leading-relaxed">
          xxxxxxxxxxxxxx
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-ink/10 shadow-sm transition-transform hover:scale-[1.02]">
          <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span className="text-xs font-medium text-ink/80">
            Click on any country in the chart to view detailed data
          </span>
        </div>

        {/* Indicator Selection Buttons */}
        <div className="mt-6 flex flex-wrap gap-1.5 p-1.5 bg-ink/5 rounded-2xl items-center border border-ink/10 w-fit">
          {indicatorIds
            .filter(id => {
              // Hide Safely managed sanitation as requested (comment out the next line to reopen)
              if (id === "SH_SAN_SAFE") return false;
              return true;
            })
            .map(id => {
            const isActive = activeIndicator === id;
            return (
              <button
                key={id}
                onClick={() => setActiveIndicator(id)}
                className={`cursor-pointer px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none ${
                  isActive 
                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                    : "text-ink-dim hover:text-ink hover:bg-black/5"
                }`}
              >
                {getIndicatorLabel(cleanWaterFull[id].label)}
              </button>
            )
          })}
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_70px] gap-8 items-start">
          {/* Chart */}
          <div ref={containerRef} className="bg-white/60 backdrop-blur-md rounded-xl p-4 sm:p-6 shadow-sm border border-ink/5 overflow-x-auto custom-scroll">
            <svg width={svgWidth} height={height} viewBox={`0 0 ${svgWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                {/* year axis labels */}
                {activeYears.map((yr) => (
                  <text
                    key={yr}
                    x={xYear(yr)}
                    y={-12}
                    textAnchor="middle"
                    fill={yr === year ? "var(--gold)" : "var(--ink-faint)"}
                    fontSize={11}
                    fontFamily="'Public Sans', ui-sans-serif, system-ui, sans-serif"
                    fontWeight={yr === year ? 600 : 400}
                  >
                    {yr}
                  </text>
                ))}
                {/* current year vertical guide */}
                <line
                  x1={xYear(year)}
                  x2={xYear(year)}
                  y1={-5}
                  y2={innerH + 10}
                  stroke="var(--gold)"
                  strokeDasharray="4,4"
                  opacity={0.3}
                />

                {/* rank lines, only through elapsed years */}
                {activeCountries.map((name) => {
                  const isHover = hover === name;
                  const rank = rankOf(name, year);
                  const isTop3 = rank < 3;
                  const pastYears = activeYears.slice(0, Math.max(1, yearIdx + 1));
                  const pathD = d3
                    .line<number>()
                    .defined((yr) => valueOf(name, yr) !== undefined)
                    .x((yr) => xYear(yr) ?? 0)
                    .y((yr) => rankOf(name, yr) * ROW_H + ROW_H / 2)
                    .curve(d3.curveMonotoneX)(pastYears);
                  return (
                    <path
                      key={name}
                      d={pathD ?? ""}
                      fill="none"
                      stroke={palette.get(name)}
                      strokeWidth={isHover ? 4 : isTop3 ? 3.5 : 2}
                      opacity={isHover ? 1 : hover ? 0.05 : isTop3 ? 1 : 0.4}
                      style={{ transition: "opacity 200ms ease, stroke-width 200ms ease" }}
                      onMouseEnter={() => setHover(name)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setSelectedCountry(name)}
                      className="cursor-pointer"
                    />
                  );
                })}

                {/* nodes at current year */}
                {activeCountries.map((name) => {
                  const rank = rankOf(name, year);
                  const val = valueOf(name, year);
                  const isHover = hover === name;
                  const isTop3 = rank < 3;
                  
                  // Don't render node if they have no data for this year
                  if (val === undefined) return null;

                  return (
                    <g
                      key={name}
                      transform={`translate(${xYear(year)},${rank * ROW_H + ROW_H / 2})`}
                      style={{ transition: "transform 550ms cubic-bezier(.4,0,.2,1)" }}
                      onMouseEnter={() => setHover(name)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setSelectedCountry(name)}
                      className="cursor-pointer"
                    >
                      <circle
                        r={isHover ? 7 : isTop3 ? 6 : 5}
                        fill={palette.get(name)}
                        stroke="var(--paper-raised)"
                        strokeWidth={1.5}
                      />
                      <rect x={10} y={-10} width={150} height={20} fill="transparent" />
                      {isTop3 && (
                        <g transform={`translate(-55, -9)`}>
                          <rect 
                            width={42} height={18} rx={9} 
                            fill={rank === 0 ? "#EF4444" : rank === 1 ? "#F97316" : "#FEF08A"} 
                          />
                          <text x={21} y={13} fontSize={10} fill={rank === 2 ? "var(--ink)" : "white"} fontWeight={700} textAnchor="middle">
                            Top {rank + 1}
                          </text>
                        </g>
                      )}
                      <text
                        x={16}
                        y={4}
                        fontSize={12}
                        fill={isHover ? "var(--ink)" : "var(--ink-dim)"}
                        fontWeight={isHover ? 600 : 400}
                        style={{ transition: "all 200ms ease" }}
                      >
                        {shortName(name)}
                        <tspan fill={isHover ? "var(--coral)" : isTop3 ? "#EF4444" : "var(--gold)"} dx={8} fontWeight={600}>
                          {val.toFixed(2)}%
                        </tspan>
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Vertical YearScrubber */}
          <div className="hidden lg:flex flex-col items-center">
            <YearScrubber
              years={activeYears}
              year={year}
              onChange={setYear}
              speedMs={1200}
              variant="vertical"
            />
          </div>

          {/* Horizontal YearScrubber (mobile only) */}
          <div className="lg:hidden col-span-full">
            <YearScrubber years={activeYears} year={year} onChange={setYear} speedMs={1200} />
          </div>
        </div>
         <SourceNote className="text-primary text-xs mt-5">
                        <span>Source: Pacific Data Hub, CLIMATE_CHANGE_SEA_INDICATORS, 2016–2024.</span>
                      </SourceNote>
               <ScrollReveal animation="fade-up" delay={600}>
                  <p className="mt-3 max-w-2xl text-sm text-primary leading-relaxed opacity-[0.7]">
                    Select an indicator below to view the ranking of Pacific countries over time. 
                    Rank 1 (top) is the best performing country. Connecting lines show position changes.
                  </p>
                </ScrollReveal>
      </div>

      {/* Modal Overlay */}
      {selectedCountry && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 px-4 py-6 sm:px-6 transition-opacity"
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setSelectedCountry(null)}
        >
          <div 
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-ink/10 bg-foam p-6 shadow-2xl transform transition-transform" 
            style={{ position: "relative", zIndex: 1001, margin: "auto", maxWidth: "32rem" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-display text-ink flex items-center gap-3">
                  <Flag iso2={indicatorDef.countries[selectedCountry].iso2} className="w-8 h-6 rounded-sm shadow-sm" />
                  {selectedCountry}
                </h3>
                <p className="text-sm text-ink-dim mt-2 font-medium">
                  {getIndicatorLabel(indicatorDef.label)} (2016 - 2024)
                </p>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
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
            
            <div className="h-[250px] mt-4">
              <ModalChart 
                series={indicatorDef.countries[selectedCountry].total} 
                years={indicatorDef.years} 
                color={palette.get(selectedCountry) || "var(--coral)"} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
