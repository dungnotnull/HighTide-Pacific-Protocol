"use client";

import { useMemo, useState, useRef } from "react";
import * as d3 from "d3";
import { cleanWaterFull, indicatorIds, shortName } from "@/lib/data";
import { useDimensions } from "@/hooks/useDimensions";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { makePalette } from "@/lib/colors";

type DataPoint = {
  country: string;
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

export default function DotPlotChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { width } = useDimensions(wrapRef);
  
  const [hoveredData, setHoveredData] = useState<DataPoint | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Extract all countries from the first indicator
  const countries = useMemo(() => Object.keys(cleanWaterFull[indicatorIds[0]].countries).sort(), []);
  const palette = useMemo(() => makePalette(countries), [countries]);

  const data = useMemo(() => {
    const pts: DataPoint[] = [];
    countries.forEach(country => {
      indicatorIds.forEach(indId => {
        const indData = cleanWaterFull[indId as keyof typeof cleanWaterFull];
        const countryData = indData.countries[country];
        if (countryData && countryData.total) {
          countryData.total.forEach(d => {
            pts.push({
              country,
              indicatorId: indId,
              indicatorLabel: ENGLISH_LABELS[indId] || indData.label,
              year: d.year,
              value: d.value,
            });
          });
        }
      });
    });
    return pts;
  }, [countries]);

  const rowHeight = 45;
  const groupSpacing = 20;
  
  // Calculate total height needed
  const totalRows = countries.length * indicatorIds.length;
  const innerH = totalRows * rowHeight + (countries.length - 1) * groupSpacing;
  
  const margin = { top: 80, right: 60, bottom: 40, left: 300 };
  const height = innerH + margin.top + margin.bottom;
  const innerW = width > 0 ? width - margin.left - margin.right : 0;

  // Years array
  const years = useMemo(() => Array.from(new Set(data.map(d => d.year))).sort(), [data]);

  // X Scale maps Years
  const xScale = useMemo(
    () => {
      if (years.length === 0) return d3.scaleLinear().domain([2016, 2024]).range([0, innerW]);
      return d3.scaleLinear()
        .domain([years[0], years[years.length - 1]])
        .range([0, innerW]);
    },
    [innerW, years]
  );
  
  // Radius Scale maps Value (0-100)
  const rScale = useMemo(
    () => d3.scaleSqrt().domain([0, 100]).range([2, 18]),
    []
  );

  // Y positions for each country and indicator
  const yPositions = useMemo(() => {
    const pos = new Map<string, number>();
    let currentY = rowHeight / 2;
    
    countries.forEach((country, cIdx) => {
      indicatorIds.forEach((indId, iIdx) => {
        pos.set(`${country}-${indId}`, currentY);
        currentY += rowHeight;
      });
      if (cIdx < countries.length - 1) {
        currentY += groupSpacing;
      }
    });
    return pos;
  }, [countries]);

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    if (!wrapRef.current) return;
    
    // Using nativeEvent.offsetX/Y gives coordinates relative to the SVG element, inherently accounting for scroll
    const x = e.nativeEvent.offsetX - margin.left;
    const y = e.nativeEvent.offsetY - margin.top;
    
    let closestPt: DataPoint | null = null;
    let closestPos = { x: 0, y: 0 };
    let minD = 30; // max distance to hover
    
    data.forEach(d => {
      const cx = xScale(d.year);
      const cy = yPositions.get(`${d.country}-${d.indicatorId}`) || 0;
      const dist = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
      if (dist < minD) {
        minD = dist;
        closestPt = d;
        closestPos = { x: cx + margin.left, y: cy + margin.top };
      }
    });

    if (closestPt) {
      setHoveredData(closestPt);
      setHoverPos(closestPos);
    } else {
      setHoveredData(null);
    }
  };

  return (
    <section className="relative mt-20 pt-10">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal animation="fade-down" delay={200}>
          <h2 className="font-display text-2xl sm:text-3xl text-ink max-w-3xl">
            Detailed view of clean water metrics
          </h2>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={400}>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-ink-dim leading-relaxed">
            Distribution of the clean water and sanitation indicators over the years ({years[0]} - {years[years.length - 1]}).
            The size of each bubble corresponds to the percentage value.
          </p>
        </ScrollReveal>

        <div className="mt-10 relative">
          <div className="w-full overflow-x-auto overflow-y-hidden custom-scroll rounded-lg border border-ink/10 bg-white/60 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative" ref={wrapRef}>
            {width > 0 && (
              <svg width={Math.max(width, 800)} height={height} className="block overflow-visible font-sans" onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredData(null)}>
                <g transform={`translate(${margin.left},${margin.top})`}>
                  
                  {/* Grid Lines X-Axis (Years) */}
                  {years.map(year => (
                    <g key={`x-${year}`} transform={`translate(${xScale(year)},0)`}>
                      <line y1={0} y2={innerH} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 4" />
                      <text y={-10} textAnchor="middle" fill="#6b7280" fontSize={11} fontWeight="500">
                        {year}
                      </text>
                      <text y={innerH + 25} textAnchor="middle" fill="#6b7280" fontSize={11} fontWeight="500">
                        {year}
                      </text>
                    </g>
                  ))}

                  {/* Header labels */}
                  <text x={-margin.left + 20} y={-50} fill="#4b5563" fontSize={11} fontWeight="500">Countries</text>
                  <text x={-margin.left + 120} y={-50} fill="#4b5563" fontSize={11} fontWeight="500">Indicators</text>
                  <line x1={-margin.left + 20} x2={innerW} y1={-35} y2={-35} stroke="#d1d5db" strokeWidth={1} />

                  {/* Y Axis Labels and Dividers */}
                  {countries.map((country, cIdx) => {
                    const countryStartY = yPositions.get(`${country}-${indicatorIds[0]}`) || 0;
                    return (
                      <g key={country}>
                        {/* Country Label (Top Aligned to its group) */}
                        <text x={-margin.left + 20} y={countryStartY + (indicatorIds.length * rowHeight / 2) - (rowHeight / 2)} fill="#374151" fontSize={12} fontWeight="600" dominantBaseline="middle">
                          {shortName(country)}
                        </text>
                        
                        {/* Indicator Labels & Lines */}
                        {indicatorIds.map((indId, iIdx) => {
                          const y = yPositions.get(`${country}-${indId}`) || 0;
                          const label = ENGLISH_LABELS[indId] || indId;

                          return (
                            <g key={indId} transform={`translate(0, ${y})`}>
                              <text x={-margin.left + 120} y={0} fill="#4b5563" fontSize={11} dominantBaseline="middle">
                                {label}
                              </text>
                              
                              {/* Horizontal guide line for each row */}
                              <line x1={-margin.left + 120} x2={innerW} y1={0} y2={0} stroke="#e5e7eb" strokeWidth={1} strokeOpacity={0.6} />
                            </g>
                          );
                        })}
                        
                        {/* Group divider */}
                        {cIdx < countries.length - 1 && (
                          <line 
                            x1={-margin.left + 20} 
                            x2={innerW} 
                            y1={countryStartY + (indicatorIds.length * rowHeight) - rowHeight/2 + groupSpacing/2 - 20} 
                            y2={countryStartY + (indicatorIds.length * rowHeight) - rowHeight/2 + groupSpacing/2 - 20} 
                            stroke="#d1d5db" 
                            strokeWidth={1} 
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Data Points */}
                  {data.map((d, i) => {
                    const cx = xScale(d.year);
                    const cy = yPositions.get(`${d.country}-${d.indicatorId}`) || 0;
                    const color = palette.get(d.country) || "var(--coral)";
                    
                    const r = rScale(d.value);
                    const isHovered = hoveredData?.country === d.country && hoveredData?.indicatorId === d.indicatorId && hoveredData?.year === d.year;

                    return (
                      <circle 
                        key={i} 
                        cx={cx} 
                        cy={cy} 
                        r={isHovered ? r + 3 : r} 
                        fill={color} 
                        fillOpacity={0.7}
                        stroke="#ffffff"
                        strokeWidth={1}
                        style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
                      />
                    );
                  })}
                </g>
              </svg>
            )}
            
            {/* Tooltip */}
            {hoveredData && (
              <div 
                className="absolute z-[100] pointer-events-none bg-white border border-ink/10 shadow-lg rounded px-3 py-2 text-xs"
                style={{
                  left: hoverPos.x - 12,
                  top: hoverPos.y,
                  transform: 'translate(-100%, -50%)'
                }}
              >
                <div className="font-bold text-ink mb-1">{shortName(hoveredData.country)} ({hoveredData.year})</div>
                <div className="text-ink-dim max-w-[200px] truncate mb-1">{hoveredData.indicatorLabel}</div>
                <div className="font-medium">{hoveredData.value.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
