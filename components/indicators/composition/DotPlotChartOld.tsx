"use client";

import { useMemo, useState, useRef } from "react";
import * as d3 from "d3";
import { cleanWaterFull, indicatorIds, shortName } from "@/lib/data";
import { useDimensions } from "@/hooks/useDimensions";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Flag from "@/components/ui/Flag";
import { SourceNote } from "@/components/ui/SourceNote";

type DataPoint = {
  indicatorId: string;
  indicatorLabel: string;
  year: number;
  value: number;
};

const ENGLISH_LABELS: Record<string, string> = {
  "SH_H2O_SAFE": "Safely managed drinking water",
  "SH_SAN_HNDWSH": "Basic handwashing facilities",
  "SH_SAN_DEFECT": "Open defecation",
  "SH_SAN_SAFE": "Safely managed sanitation"
};
const THRESHOLD = 1.0;
const ORDERED_INDICATORS = ["SH_H2O_SAFE", "SH_SAN_DEFECT", "SH_SAN_HNDWSH"];

export default function DotPlotChartOld() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { width } = useDimensions(wrapRef);
  
  const [hoveredData, setHoveredData] = useState<DataPoint | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const countries = useMemo(() => {
    const set = new Set<string>();
    ORDERED_INDICATORS.forEach(id => {
      Object.keys(cleanWaterFull[id]?.countries || {}).forEach(c => set.add(c));
    });
    return Array.from(set).sort();
  }, []);
  const [selectedCountry, setSelectedCountry] = useState<string>(countries[0]);

  const countryDataByIndicator = useMemo(() => {
    const dataMap = new Map<string, DataPoint[]>();
    ORDERED_INDICATORS.forEach(indId => {
      const indData = cleanWaterFull[indId as keyof typeof cleanWaterFull];
      const countryData = indData?.countries[selectedCountry];
      const pts: DataPoint[] = [];
      if (countryData && countryData.total && countryData.total.length > 0) {
        countryData.total.forEach(d => {
          pts.push({
            indicatorId: indId,
            indicatorLabel: ENGLISH_LABELS[indId] || indData.label,
            year: d.year,
            value: d.value,
          });
        });
      }
      dataMap.set(indId, pts);
    });
    return dataMap;
  }, [selectedCountry]);

  // Determine trend color
  const getTrendColor = (indId: string) => {
    const pts = countryDataByIndicator.get(indId);
    if (!pts || pts.length < 2) return "var(--ink)";
    const first = pts[0].value;
    const last = pts[pts.length - 1].value;
    const diff = last - first;
    
    if (Math.abs(diff) < 0.001) return "var(--ink)";
    
    const polarity = cleanWaterFull[indId as keyof typeof cleanWaterFull]?.polarity;
    const improved = polarity === "bad" ? diff < 0 : diff > 0;
    
    return improved ? "#10b981" : "#ef4444"; // green for improved, red for declined
  };

  const rowHeight = 120;
  const innerH = ORDERED_INDICATORS.length * rowHeight;
  
  const margin = { top: 80, right: width < 640 ? 20 : 60, bottom: 40, left: width < 640 ? 140 : 220 };
  const height = innerH + margin.top + margin.bottom;
  const innerW = width > 0 ? width - margin.left - margin.right : 0;

  const xScale = useMemo(
    () => d3.scaleLinear().domain([0, 100]).range([0, innerW]),
    [innerW]
  );

  const yPositions = useMemo(() => {
    const pos = new Map<string, number>();
    let currentY = rowHeight / 2;
    ORDERED_INDICATORS.forEach(indId => {
      pos.set(indId, currentY);
      currentY += rowHeight;
    });
    return pos;
  }, []);

  const averages = useMemo(() => {
    const avgs = new Map<string, number>();
    ORDERED_INDICATORS.forEach(indId => {
      const pts = countryDataByIndicator.get(indId);
      if (pts && pts.length > 0) {
        const mean = d3.mean(pts, d => d.value) || 0;
        avgs.set(indId, mean);
      }
    });
    return avgs;
  }, [countryDataByIndicator]);

  const allYears = useMemo(() => {
    const yearsSet = new Set<number>();
    ORDERED_INDICATORS.forEach(indId => {
      const pts = countryDataByIndicator.get(indId);
      pts?.forEach(p => yearsSet.add(p.year));
    });
    return Array.from(yearsSet).sort();
  }, [countryDataByIndicator]);

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    
    // Using nativeEvent.offsetX/Y gives coordinates relative to the SVG element, inherently accounting for scroll
    const x = e.nativeEvent.offsetX - margin.left;
    const y = e.nativeEvent.offsetY - margin.top;
    
    let closestPt: DataPoint | null = null;
    let closestPos = { x: 0, y: 0 };
    let minD = 30;
    
    for (const indId of ORDERED_INDICATORS) {
      const pts = countryDataByIndicator.get(indId);
      if (!pts) continue;
      
      for (const d of pts) {
        const cx = xScale(d.value);
        const yearIdx = allYears.indexOf(d.year);
        const cyOffset = (yearIdx - (allYears.length - 1) / 2) * 12;
        const cy = (yPositions.get(d.indicatorId) || 0) + cyOffset;
        const dist = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
        if (dist < minD) {
          minD = dist;
          closestPt = d;
          closestPos = { x: cx + margin.left, y: cy + margin.top };
        }
      }
    }
    
    if (closestPt) {
      setHoveredData(closestPt);
      setHoverPos(closestPos);
    } else {
      setHoveredData(null);
    }
  };

  return (
    <section className="relative mb-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal animation="fade-down" delay={200}>
          <p className="eyebrow text-lagoon">Impact on Pacific WASH</p>
        </ScrollReveal>
        <ScrollReveal animation="fade-down" delay={200}>
          <h2 className="font-display text-2xl sm:text-3xl text-ink max-w-3xl mt-2">
            As the sea rises, WASH stands still
          </h2>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={400}>
          <div className="mt-3 max-w-3xl text-sm sm:text-base text-ink-dim leading-relaxed space-y-3">
            <p>
              Water, Sanitation, and Hygiene (WASH) is a fundamental part of
              development, enabling families to live clean and healthy lives.
              Yet delivering WASH services across PICs remains difficult due to
              their remote geography, small and largely rural populations,
              limited resources, and cultural diversity. WASH challenges have
              been intensified by climate change, especially rising sea
              levels.
            </p>
            <p>
              Climate change is generating unsanitary conditions that limit
              access to safe water and hinder the development of adequate WASH
              infrastructure. Rising sea levels are driving more frequent and
              severe flooding, which in turn raises the risk of waterborne
              pathogens leaking from sewage systems and spreading disease.
              Poor WASH practices further contribute to pollution, damaging
              the ecosystems and biodiversity of Pacific islands.
            </p>
            <p>
              There is not enough data to provide a complete picture, but the
              available data suggests that the three WASH indicators - safely
              managed drinking water, open defecation, and basic handwashing
              facilities - have improved only marginally in some countries,
              while others show stagnation or even decline.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 w-full  overflow-hidden custom-scroll rounded-lg border border-ink/10 bg-white/60 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative" ref={wrapRef} style={{ minHeight: height }}>
            {width > 0 && (
              <svg width={Math.max(width, 600)} height={height} className="block overflow-visible font-sans" onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredData(null)}>
                <g transform={`translate(${margin.left},${margin.top})`}>
                  
                  {xScale.ticks(width < 640 ? 5 : 10).map(tick => (
                    <g key={`x-${tick}`} transform={`translate(${xScale(tick)},0)`}>
                      <line y1={0} y2={innerH} stroke="#e5e7eb" strokeWidth={1} />
                      <text y={-25} textAnchor="middle" fill="#6b7280" fontSize={11} fontWeight="500">
                        {tick}%
                      </text>
                    </g>
                  ))}

                  <text x={-margin.left + 20} y={-60} fill="#4b5563" fontSize={11} fontWeight="500">Indicators</text>
                  <line x1={-margin.left + 20} x2={innerW} y1={-42} y2={-42} stroke="#d1d5db" strokeWidth={1} />

                  {ORDERED_INDICATORS.map((indId, iIdx) => {
                    const y = yPositions.get(indId) || 0;
                    const avg = averages.get(indId);
                    const label = ENGLISH_LABELS[indId] || indId;
                    const pts: DataPoint[] = countryDataByIndicator.get(indId) || [];
                    const hasData = pts.length > 0;
                    const trendColor = getTrendColor(indId);

                    return (
                      <g key={indId} transform={`translate(0, ${y})`}>
                        {/* Indicator Label */}
                        <foreignObject x={-margin.left + 10} y={-20} width={margin.left - 20} height={40}>
                          <div className="flex items-center justify-start h-full text-[10px] sm:text-xs font-semibold text-ink/80 leading-tight">
                            {label}
                          </div>
                        </foreignObject>
                        
                        <line x1={0} x2={innerW} y1={0} y2={0} stroke="#e5e7eb" strokeWidth={1} strokeOpacity={0.6} />
                        
                        {!hasData && (
                          <text x={innerW / 2} y={0} fill="#9ca3af" fontSize={12} fontStyle="italic" dominantBaseline="middle" textAnchor="middle">
                            N/A
                          </text>
                        )}
                        
                        {/* Data points */}
                        {pts.map((d) => {
                          const cx = xScale(d.value);
                          const yearIdx = allYears.indexOf(d.year);
                          const isLatest = d.year === allYears[allYears.length - 1];
                          const cyOffset = (yearIdx - (allYears.length - 1) / 2) * 12;
                          
                          const r = 5 + (yearIdx / allYears.length) * 7;
                          const opacity = 0.4 + (yearIdx / allYears.length) * 0.6;
                          const isHovered = hoveredData?.indicatorId === d.indicatorId && hoveredData?.year === d.year;

                          const isEarliest = d.year === allYears[0] && d.year !== allYears[allYears.length - 1];

                          return (
                            <g key={`${d.year}`}>
                              <circle 
                                cx={cx} 
                                cy={cyOffset} 
                                r={isHovered ? r + 3 : r} 
                                fill={trendColor} 
                                fillOpacity={opacity}
                                stroke={isLatest ? "#ffffff" : "none"}
                                strokeWidth={1.5}
                                style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
                              />
                              {isEarliest && (
                                <text 
                                  x={cx} y={cyOffset - r - 4} 
                                  fill="var(--ink-dim)" 
                                  fontSize={9} 
                                  textAnchor="middle"
                                >
                                  {d.year}
                                </text>
                              )}
                              {isLatest && (
                                <text 
                                  x={cx} y={cyOffset + r + 10} 
                                  fill="var(--ink)" 
                                  fontSize={9.5} 
                                  fontWeight="600" 
                                  textAnchor="middle"
                                >
                                  {d.year}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Average line and modern callout rendered on top */}
                        {hasData && avg !== undefined && (
                          <g transform={`translate(${xScale(avg)}, 0)`} style={{ pointerEvents: 'none' }}>
                            <line 
                              x1={0} x2={0} 
                              y1={-55} y2={55} 
                              stroke="var(--ink-dim)" 
                              strokeWidth={1.2}
                              strokeDasharray="4 4"
                              opacity={0.5}
                            />
                            
                            {/* Pill Badge */}
                            <g transform="translate(0, 0)">
                              {/* Connecting line */}
                              <line 
                                x1={0} x2={avg > 50 ? -45 : 45} 
                                y1={0} y2={0} 
                                stroke="var(--ink-dim)" 
                                strokeWidth={1} 
                                strokeDasharray="2 2" 
                              />
                              <g transform={`translate(${avg > 50 ? -45 : 45}, 0)`}>
                                <rect 
                                  x={-35} y={-10} 
                                  width={70} height={20} 
                                  rx={10} 
                                  fill="#f97316" 
                                  stroke="white"
                                  strokeWidth={2}
                                />
                                <text 
                                  x={0} y={1} 
                                  fill="white" 
                                  fontSize={9.5} 
                                  fontWeight="700" 
                                  textAnchor="middle" 
                                  dominantBaseline="middle"
                                >
                                  Avg: {avg.toFixed(1)}%
                                </text>
                              </g>
                            </g>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}
            
            {hoveredData && (
              <div 
                className="absolute z-[100] pointer-events-none bg-white border border-ink/10 shadow-lg rounded px-3 py-2 text-xs"
                style={{
                  left: hoverPos.x - 12,
                  top: hoverPos.y,
                  transform: 'translate(-100%, -50%)'
                }}
              >
                <div className="font-bold text-ink mb-1">{shortName(selectedCountry)} ({hoveredData.year})</div>
                <div className="text-ink-dim max-w-[200px] truncate mb-1">{hoveredData.indicatorLabel}</div>
                <div className="font-medium">{hoveredData.value.toFixed(1)}%</div>
              </div>
            )}
          </div>

          <div className="lg:w-64 shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col lg:justify-start max-h-[500px] overflow-y-auto pr-2 gap-x-2 gap-y-1 custom-scroll">
            {countries.map((name) => {
              const isSelected = selectedCountry === name;
              // Assuming all countries have a flag via cleanWaterFull[...].countries[name].iso2
              const iso2 = cleanWaterFull[indicatorIds[0]]?.countries[name]?.iso2 || "un";

              return (
                <div
                  key={name}
                  onClick={() => setSelectedCountry(name)}
                  className={`
                    flex items-center gap-2 p-1.5 lg:p-2 rounded cursor-pointer transition-all
                    ${isSelected ? 'bg-ink/5 font-semibold text-ink' : 'opacity-70 hover:opacity-100 text-ink'}
                  `}
                >
                  <Flag iso2={iso2} className="w-5 h-3.5 shrink-0 shadow-sm" />
                  <span className="text-xs truncate flex-1">{shortName(name)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4">
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
            Distribution of clean water and sanitation indicators for a
            selected country, with dots representing yearly values from 2016
            to 2024, stacked vertically. Color indicates the overall trend
            (Green: Improved, Red: Declined, Black: Unchanged).
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
