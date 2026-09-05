"use client";

import { useMemo, useState, useRef } from "react";
import * as d3 from "d3";
import {
  seaLevelData,
  seaLevelCountries,
  seaLevelYears,
  shortName,
} from "@/lib/data";
import { makePalette } from "@/lib/colors";
import Flag from "@/components/ui/Flag";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useDimensions } from "@/hooks/useDimensions";
import { YearValue } from "@/types";
import { SourceNote } from "@/components/ui/SourceNote";

export default function Part1Chart2() {
  const palette = useMemo(() => makePalette(seaLevelCountries), []);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoverData, setHoverData] = useState<{ year: number, value: number, x: number, y: number } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const { width } = useDimensions(wrapRef);
  const height = 500;

  const allValuesMm = useMemo(
    () =>
      Object.values(seaLevelData).flatMap((c) =>
        c.series
          .filter(s => s.year >= seaLevelYears[0] && s.year <= seaLevelYears[seaLevelYears.length - 1])
          .map((s) => s.value)
      ),
    []
  );
  
  const margin = { top: 40, right: 40, bottom: 40, left: 50 };
  const innerW = width > 0 ? width - margin.left - margin.right : 0;
  const innerH = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () => d3.scaleLinear().domain([seaLevelYears[0], seaLevelYears[seaLevelYears.length - 1]]).range([0, innerW]),
    [innerW]
  );

  const yScale = useMemo(
    () => d3.scaleLinear().domain(d3.extent(allValuesMm) as [number, number]).nice().range([innerH, 0]),
    [allValuesMm, innerH]
  );

  const lineGenerator = useMemo(
    () => d3.line<YearValue>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX),
    [xScale, yScale]
  );

  const getTrendLine = (data: YearValue[]) => {
    const xSeries = data.map(d => d.year);
    const ySeries = data.map(d => d.value);
    const xMean = d3.mean(xSeries) || 0;
    const yMean = d3.mean(ySeries) || 0;
    const denominator = d3.sum(xSeries.map(x => Math.pow(x - xMean, 2)));
    const slope = denominator ? d3.sum(xSeries.map((x, i) => (x - xMean) * (ySeries[i] - yMean))) / denominator : 0;
    const intercept = yMean - slope * xMean;
    
    const firstYear = xSeries[0];
    const lastYear = xSeries[xSeries.length - 1];
    return {
      x1: xScale(firstYear),
      y1: yScale(slope * firstYear + intercept),
      x2: xScale(lastYear),
      y2: yScale(slope * lastYear + intercept)
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>, country: string, series: YearValue[]) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    const year = Math.round(xScale.invert(x));
    
    // Ensure year is within bounds
    if (year >= seaLevelYears[0] && year <= seaLevelYears[seaLevelYears.length - 1]) {
      const dataPoint = series.find(s => s.year === year);
      if (dataPoint) {
        setHoverData({
          year,
          value: dataPoint.value,
          x: xScale(year),
          y: yScale(dataPoint.value)
        });
      }
    }
  };

  return (
    <section id="part1-chart2" className="relative bg-foam px-6 py-14 md:px-16">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal animation="fade-down" delay={200}>
          <p className="eyebrow text-lagoon">Pacific sea status</p>
        </ScrollReveal>
        <ScrollReveal animation="fade-down" delay={200}>
          <h1 className="font-display text-3xl sm:text-4xl text-ink max-w-3xl mt-2">
            Rising Seas, Starved of Water
          </h1>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={400}>
          <div className="mt-3 max-w-3xl text-sm sm:text-base text-ink-dim leading-relaxed space-y-3">
            <p>
              Over the years, sea-level anomalies have remained high across the
              PICs, with an overall upward trend. Low-lying nations face severe
              environmental and societal pressures from rising sea levels
              driven by climate change. Rising sea levels erode coastlines,
              damage infrastructure, cause flooding, and contaminate
              freshwater reserves and agricultural land. This places additional
              pressure on WASH systems across Pacific communities.
            </p>
            <p>
              Despite being surrounded by water, PICs struggle with access to
              safe drinking water - a crisis that is being intensified by
              climate change.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 flex flex-col lg:flex-row gap-8">
          {/* Chart Area */}
          <div className="flex-1 rounded-lg border border-ink/10 bg-white/60 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.08)]" ref={wrapRef} style={{ height }}>
            {width > 0 && (
              <svg width={width} height={height} className="overflow-visible block">
                <g transform={`translate(${margin.left},${margin.top})`}>
                  {/* Grid Lines */}
                  {yScale.ticks(6).map(tick => (
                    <g key={`y-${tick}`} transform={`translate(0,${yScale(tick)})`}>
                      <line x1={0} x2={innerW} stroke="var(--ink-faint)" strokeOpacity={0.2} strokeDasharray="4 4" />
                      <text x={-10} y={4} textAnchor="end" fill="var(--ink-faint)" fontSize={11} fontFamily="'Public Sans', ui-sans-serif, system-ui, sans-serif">
                        {tick}mm
                      </text>
                    </g>
                  ))}
                  {xScale.ticks(5).map(tick => (
                    <g key={`x-${tick}`} transform={`translate(${xScale(tick)},0)`}>
                      <line y1={0} y2={innerH} stroke="var(--ink-faint)" strokeOpacity={0.2} strokeDasharray="4 4" />
                      <text y={innerH + 15} textAnchor="middle" fill="var(--ink-faint)" fontSize={11} fontFamily="'Public Sans', ui-sans-serif, system-ui, sans-serif">
                        {tick}
                      </text>
                    </g>
                  ))}

                  {/* Lines */}
                  {seaLevelCountries.map(name => {
                    const rawSeries = seaLevelData[name].series;
                    // Filter series to only include years in the xScale domain to prevent overflow
                    const series = rawSeries.filter(s => s.year >= seaLevelYears[0] && s.year <= seaLevelYears[seaLevelYears.length - 1]);
                    
                    const isHovered = hoveredCountry === name;
                    const isDimmed = hoveredCountry !== null && !isHovered;
                    const color = palette.get(name) || "var(--coral)";
                    
                    return (
                      <g key={name}>
                        <path
                          d={lineGenerator(series) || undefined}
                          fill="none"
                          stroke={color}
                          strokeWidth={isHovered ? 3 : 1.5}
                          strokeOpacity={isDimmed ? 0.03 : 0.8}
                          style={{ transition: 'all 0.3s ease' }}
                        />
                        {/* Invisible thicker path for easier hover */}
                        <path
                          d={lineGenerator(series) || undefined}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={20}
                          onMouseEnter={() => setHoveredCountry(name)}
                          onMouseLeave={() => { setHoveredCountry(null); setHoverData(null); }}
                          onMouseMove={(e) => handleMouseMove(e, name, series)}
                          className="cursor-pointer"
                        />
                        
                        {/* Trend line for hovered country */}
                        {isHovered && (
                          <line
                            {...getTrendLine(series)}
                            stroke={color}
                            strokeWidth={2}
                            strokeDasharray="6 6"
                            opacity={0.6}
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Tooltips for all years of hovered country */}
                  {hoveredCountry && (
                    <g>
                      {seaLevelData[hoveredCountry].series
                        .filter(s => s.year >= seaLevelYears[0] && s.year <= seaLevelYears[seaLevelYears.length - 1])
                        .map(s => {
                          const x = xScale(s.year);
                          const y = yScale(s.value);
                          const color = palette.get(hoveredCountry) || "var(--coral)";
                          return (
                            <g key={s.year} transform={`translate(${x},${y})`}>
                              <circle r={4} fill={color} />
                              <rect x={-20} y={-24} width={40} height={18} fill="white" rx={3} stroke="var(--ink-faint)" strokeOpacity={0.2} className="shadow-sm" />
                              <text x={0} y={-11} textAnchor="middle" fill="var(--ink)" fontSize={10} fontFamily="'Public Sans', ui-sans-serif, system-ui, sans-serif" fontWeight="bold">
                                {(s.value) > 0 ? '+' : ''}{(s.value).toFixed(3)}
                              </text>
                            </g>
                          );
                      })}
                    </g>
                  )}
                </g>
              </svg>
            )}
          </div>

          {/* Legend Area */}
          <div className="lg:w-64 shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col lg:justify-between max-h-[500px] overflow-y-auto pr-2 gap-x-2 gap-y-1">
            {/* <h3 className="text-sm font-semibold text-ink/70 mb-2 uppercase tracking-wider">Countries</h3> */}
            {seaLevelCountries.map((name, index) => {
  const iso2 = seaLevelData[name].iso2;
  const isHovered = hoveredCountry === name;
  const isDimmed = hoveredCountry !== null && !isHovered;
  const color = palette.get(name) || "var(--coral)";
  const isFirst = index === 0;

  const shouldBlink = isFirst && hoveredCountry === null;

  return (
    <div
      key={name}
      className={`
        flex items-center gap-2 p-1.5 lg:p-2 rounded cursor-pointer transition-all
        ${isHovered ? 'bg-ink/5' : ''}
        ${isDimmed ? 'opacity-40' : 'opacity-100'}
        ${shouldBlink ? 'animate-blink-bg' : ''}
        ${isFirst && isDimmed ? 'bg-transparent' : ''}
      `}
      onMouseEnter={() => setHoveredCountry(name)}
      onMouseLeave={() => {
        setHoveredCountry(null);
        setHoverData(null);
      }}
    >
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <Flag iso2={iso2} className="w-5 h-3.5 shrink-0 shadow-sm" />
      <span className="text-xs font-medium text-ink truncate">{shortName(name)}</span>
    </div>
  );
})}
          </div>
        </div>
         <SourceNote className="text-primary text-xs mt-2 md:mt-6">
                <span>Data source: Sea level anomalies (</span>
                <a
                  href="https://cds.climate.copernicus.eu/datasets/satellite-sea-level-global?tab=overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  Climate Data Store
                </a>
                <span>).</span>
              </SourceNote>
         <ScrollReveal animation="fade-up" delay={400}>
          <p className="mt-4 max-w-3xl text-sm text-primary leading-relaxed opacity-[0.7]">
            Relative sea level anomalies by country ({seaLevelYears[0]}–{seaLevelYears[seaLevelYears.length - 1]}).
            Hover over a country in the legend or chart for details.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
