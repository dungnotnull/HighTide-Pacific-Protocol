"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cleanWaterFull, indicatorIds, shortName, cleanWaterYears } from "@/lib/data";
import { makePalette, NEUTRAL_LINE } from "@/lib/colors";
import Flag from "@/components/ui/Flag";
import { SourceNote } from "@/components/ui/SourceNote";

const YEAR_EARLY = cleanWaterYears[0];
const YEAR_LATE = cleanWaterYears[cleanWaterYears.length - 1];

interface Step {
  kicker: string;
  text: string;
  align: "left" | "right";
  highlightCountries: string[];
  indId: string;
  localStepIndex: number;
}

const ENGLISH_LABELS: Record<string, string> = {
  "SH_H2O_SAFE": "Safely managed drinking water",
  "SH_SAN_HNDWSH": "Basic handwashing facilities",
  "SH_SAN_DEFECT": "Open defecation",
  "SH_SAN_SAFE": "Safely managed sanitation"
};

function getValForYear(dataObj: any, kind: "urban" | "rural", targetYear: number, exactOnly: boolean = false): number {
  if (!dataObj || !dataObj[kind] || dataObj[kind].length === 0) return 0;
  const exact = dataObj[kind].find((s: any) => s.year === targetYear);
  if (exact) return exact.value;
  if (exactOnly) return 0;
  
  const closest = dataObj[kind].reduce((prev: any, curr: any) => 
    Math.abs(curr.year - targetYear) < Math.abs(prev.year - targetYear) ? curr : prev
  );
  return closest ? closest.value : 0;
}

function hasExactYear(dataObj: any, kind: "urban" | "rural", year: number): boolean {
  return dataObj && dataObj[kind] && dataObj[kind].some((s: any) => s.year === year);
}

function generateStepsForIndicator(indId: string, index: number): Omit<Step, "indId" | "localStepIndex">[] {
  const data = cleanWaterFull[indId as keyof typeof cleanWaterFull].countries;
  const countries = Object.keys(data).filter(
    (name) => hasExactYear(data[name], "urban", YEAR_LATE) && hasExactYear(data[name], "rural", YEAR_LATE)
  );
  
  if (countries.length === 0) return [];

  const label = ENGLISH_LABELS[indId] || cleanWaterFull[indId as keyof typeof cleanWaterFull].label;
  
  const gapData = countries.map(name => {
    const urban = getValForYear(data[name], "urban", YEAR_LATE, true);
    const rural = getValForYear(data[name], "rural", YEAR_LATE, true);
    const gap = Math.abs(urban - rural);
    return { name, urban, rural, gap };
  }).sort((a, b) => b.gap - a.gap);

  const largest = gapData[0] || { name: "", urban: 0, rural: 0, gap: 0 };
  const narrowest = gapData[gapData.length - 1] || { name: "", urban: 0, rural: 0, gap: 0 };
  
  const isReversed = indId === "SH_SAN_DEFECT"; // Open defecation: smaller is better
  
  let aboveCount = 0;
  let belowCount = 0;
  gapData.forEach(d => {
    if (d.urban > d.rural) aboveCount++;
    else if (d.rural > d.urban) belowCount++;
  });
  
  // Equal-value ties listed in reverse alphabetical order (e.g. "Palau and Fiji")
  const onDiagonal = gapData
    .filter((d) => d.urban === d.rural)
    .sort((a, b) => b.name.localeCompare(a.name));
  const onNames = onDiagonal.map((d) => shortName(d.name)).join(" and ");
  const aboveDiagonal = gapData.filter((d) => d.urban > d.rural);
  const aboveNames = aboveDiagonal.map((d) => shortName(d.name)).join(" and ");

  let patternText = "";
  if (aboveCount === countries.length) {
    patternText = `All ${countries.length} countries fall ABOVE the diagonal - meaning in every country without exception, urban rates are better than rural.`;
  } else if (belowCount === countries.length) {
    patternText = `All ${countries.length} countries fall BELOW the diagonal - meaning rural rates are higher than urban rates.`;
  } else if (belowCount > aboveCount) {
    patternText = `While ${belowCount}/${countries.length} countries fall BELOW the diagonal, meaning rural rates are typically higher than urban rates - worse conditions in rural areas with big gaps`;
    if (aboveDiagonal.length > 0) {
      patternText += `, ${aboveNames} ${aboveDiagonal.length > 1 ? "fall" : "falls"} ABOVE it with small gaps`;
    }
    patternText += `.`;
    if (onDiagonal.length > 0) {
      patternText += ` ${onNames} ${onDiagonal.length > 1 ? "are" : "is"} ON the diagonal.`;
    }
  } else {
    patternText = `${aboveCount}/${countries.length} countries fall ABOVE the diagonal - meaning urban rates are typically better than rural rates.`;
  }

  // Adjust wording for Open Defecation
  const widestKicker = isReversed ? "WORST DISPARITY" : "WIDEST GAP";
  
  const prefix = indId.includes("H2O") ? "WATER" : indId === "SH_SAN_HNDWSH" ? "HYGIENE" : "SANITATION";
  
  // Equal-gap ties listed in reverse alphabetical order (e.g. "Palau and Fiji")
  const narrowestList = gapData
    .filter((d) => d.gap === narrowest.gap)
    .sort((a, b) => b.name.localeCompare(a.name));
  const narrowestNames = narrowestList.map((d) => shortName(d.name)).join(" and ");

  return [
    {
      kicker: `${prefix}`,
      text: `${index === 0 ? "Each dot is one country. " : ""}Rural (X-axis) versus Urban (Y-axis) rates (% of population) for ${label} in ${YEAR_LATE}.`,
      align: "left",
      highlightCountries: []
    },
    {
      kicker: `${prefix} — THE PATTERN`,
      text: patternText,
      align: "right",
      highlightCountries: []
    },
    {
      kicker: `${prefix} — ${widestKicker}`,
      text: `${shortName(largest.name)}: ${largest.urban.toFixed(1)}% of urban population compared to ${largest.rural.toFixed(1)}% in rural areas - a ${largest.gap.toFixed(1)}-point gap, the widest in the region.`,
      align: "left",
      highlightCountries: [largest.name]
    },
    {
      kicker: `${prefix} — NARROWEST GAP`,
      text: `${narrowestNames}: just a ${narrowest.gap.toFixed(1)}-point gap between urban (${narrowestList[0].urban.toFixed(1)}%) and rural (${narrowestList[0].rural.toFixed(1)}%).`,
      align: "right",
      highlightCountries: narrowestList.map((d) => d.name)
    }
  ];
}

export default function Part2Chart2V2() {
  const [currentStep, setCurrentStep] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const graphicRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(520);

  const allStepsWithMeta = useMemo(() => {
    const arr: Step[] = [];
    indicatorIds.forEach((indId, index) => {
      const steps = generateStepsForIndicator(indId, index);
      steps.forEach((s, i) => {
        arr.push({ ...s, indId, localStepIndex: i });
      });
    });
    return arr;
  }, []);

  const currentMeta = allStepsWithMeta[currentStep] || allStepsWithMeta[0];
  const activeIndId = currentMeta.indId;
  const localStep = currentMeta.localStepIndex;
  
  const activeData = cleanWaterFull[activeIndId as keyof typeof cleanWaterFull].countries;
  const SCATTER_COUNTRIES = useMemo(() => Object.keys(activeData).filter(
    (name) => hasExactYear(activeData[name], "urban", YEAR_LATE) && hasExactYear(activeData[name], "rural", YEAR_LATE)
  ), [activeData]);
  
  const palette = useMemo(() => makePalette(SCATTER_COUNTRIES), [SCATTER_COUNTRIES]);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const vh = window.innerHeight;
        const maxSize = vh < 700 ? 420 : 500;
        const s = Math.max(
          Math.min(e.contentRect.width, e.contentRect.height, maxSize),
          280
        );
        setSize(s);
      }
    });
    if (graphicRef.current) ro.observe(graphicRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset.stepIndex);
          if (!Number.isNaN(idx)) setCurrentStep(idx);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [allStepsWithMeta.length]);

  const margin = { top: 26, right: 22, bottom: 52, left: 52 };
  const innerW = size - margin.left - margin.right;
  const innerH = size - margin.top - margin.bottom;

  const scale = (v: number) => (v / 100) * innerW;

  const getVal = (name: string, kind: "urban" | "rural", year: number) =>
    getValForYear(activeData[name], kind, year, year === YEAR_LATE);

  const showDiagonalShade = localStep >= 1;
  const highlightCountries = currentMeta.highlightCountries;
  const isHighlighted = (name: string) => highlightCountries.includes(name);
  const showTrajectory = localStep >= 4;
  const isReversed = activeIndId === "SH_SAN_DEFECT";

  const fillFor = (name: string) =>
    localStep === 0 ? NEUTRAL_LINE : (palette.get(name) as string);

  const radiusFor = (name: string) => {
    if (hoveredNode === name) return 10;
    if (highlightCountries.length > 0) return isHighlighted(name) ? 12 : 5;
    return 7.5;
  };

  const opacityFor = (name: string) => {
    if (hoveredNode === name) return 1;
    if (highlightCountries.length > 0) return isHighlighted(name) ? 1 : 0.12;
    return localStep === 0 ? 0.55 : 0.9;
  };

  const ticks = [0, 25, 50, 75, 100];
  const activeLabel = ENGLISH_LABELS[activeIndId] || activeIndId;

  return (
    <section id="part1-chart1" className="relative bg-foam px-6 py-14 md:px-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-2xl sm:text-3xl text-ink max-w-3xl">
          Who is most affected by poor WASH? Rural or Urban?
        </h2>
        <div className="mt-8 flex items-center gap-2 text-xs text-ink-faint animate-pulse">
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <path
              d="M6 1v12M1 9l5 5 5-5"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Scroll to begin
        </div>
      </div>

      {/* SCROLLYTELLING SECTION */}
      <div className="relative max-w-6xl mx-auto">
        {/* Sticky chart */}
        <div
          ref={graphicRef}
          className="sticky top-16 h-[calc(100vh-4rem)] flex items-start pt-16 md:pt-0 md:items-center justify-center z-0"
        >
          <div className="chart-paper rounded-lg p-3 sm:p-5 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] uppercase tracking-[0.15em] text-ink-faint">
                {activeLabel} &middot; {showTrajectory ? `${YEAR_EARLY} → ${YEAR_LATE}` : YEAR_LATE}
              </span>
              <span className="text-[12px] text-ink-faint">
                {currentStep + 1} / {allStepsWithMeta.length}
              </span>
            </div>
            <svg
              width="100%"
              viewBox={`0 0 ${size} ${size}`}
              className="mx-auto block"
            >
              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* upper-triangle diagonal shading */}
                <polygon
                  points={`0,${innerH} 0,0 ${innerW},0`}
                  fill={isReversed ? "var(--coral)" : "var(--tide)"}
                  opacity={showDiagonalShade ? 0.03 : 0}
                  style={{ transition: "opacity 500ms ease, fill 500ms ease" }}
                />
                {/* gridlines */}
                {ticks.map((t) => (
                  <g key={t}>
                    <line
                      x1={0}
                      x2={innerW}
                      y1={innerH - scale(t)}
                      y2={innerH - scale(t)}
                      stroke="var(--grid)"
                      strokeWidth={0.6}
                    />
                    <line
                      x1={scale(t)}
                      x2={scale(t)}
                      y1={0}
                      y2={innerH}
                      stroke="var(--grid)"
                      strokeWidth={0.6}
                    />
                    <text
                      x={scale(t)}
                      y={innerH + 16}
                      textAnchor="middle"
                      fontSize={9}
                      fill="var(--ink-faint)"
                    >
                      {t}
                    </text>
                    {t !== 0 && (
                      <text
                        x={-8}
                        y={innerH - scale(t) + 3}
                        textAnchor="end"
                        fontSize={9}
                        fill="var(--ink-faint)"
                      >
                        {t}
                      </text>
                    )}
                  </g>
                ))}

                {/* diagonal equality line */}
                <line
                  x1={0}
                  y1={innerH}
                  x2={innerW}
                  y2={0}
                  stroke="var(--brass)"
                  strokeDasharray="3,4"
                  opacity={0.6}
                />
                {showDiagonalShade && (
                  <text
                    x={16}
                    y={24}
                    textAnchor="start"
                    fontSize={9.5}
                    fill={isReversed ? "var(--coral)" : "var(--brass-bright)"}
                    style={{ transition: "opacity 500ms ease, fill 500ms ease" }}
                  >
                    {isReversed ? "rural usually higher ↓" : "urban always higher ↑"}
                  </text>
                )}

                {/* trajectory lines (2016 -> 2024) */}
                {SCATTER_COUNTRIES.map((name) => {
                  const rx0 = scale(getVal(name, "rural", YEAR_EARLY));
                  const ry0 = innerH - scale(getVal(name, "urban", YEAR_EARLY));
                  const rx1 = scale(getVal(name, "rural", YEAR_LATE));
                  const ry1 = innerH - scale(getVal(name, "urban", YEAR_LATE));
                  return (
                    <line
                      key={`traj-${name}`}
                      x1={rx0}
                      y1={ry0}
                      x2={rx1}
                      y2={ry1}
                      stroke="var(--brass-bright)"
                      strokeWidth={1.2}
                      opacity={showTrajectory ? 0.5 : 0}
                      style={{ transition: "opacity 500ms ease, x1 500ms ease, y1 500ms ease, x2 500ms ease, y2 500ms ease" }}
                    />
                  );
                })}

                {/* faded 2016 markers */}
                {SCATTER_COUNTRIES.map((name) => {
                  const rx = scale(getVal(name, "rural", YEAR_EARLY));
                  const ry = innerH - scale(getVal(name, "urban", YEAR_EARLY));
                  return (
                    <circle
                      key={`early-${name}`}
                      cx={rx}
                      cy={ry}
                      r={4.5}
                      fill="white"
                      stroke={palette.get(name)}
                      strokeWidth={2}
                      opacity={showTrajectory ? 0.85 : 0}
                      style={{ transition: "opacity 500ms ease, cx 500ms ease, cy 500ms ease" }}
                    />
                  );
                })}

                {/* main markers (2024) */}
                {[...SCATTER_COUNTRIES]
                  .sort((a, b) => {
                    if (a === hoveredNode) return 1;
                    if (b === hoveredNode) return -1;
                    if (isHighlighted(a)) return 1;
                    if (isHighlighted(b)) return -1;
                    return 0;
                  })
                  .map((name) => {
                  const rx = scale(getVal(name, "rural", YEAR_LATE));
                  const ry = innerH - scale(getVal(name, "urban", YEAR_LATE));
                  const isHighlight = isHighlighted(name);
                  const isHovered = hoveredNode === name;
                  const showLabel = isHighlight || isHovered;
                  
                  return (
                    <g
                      key={name}
                      transform={`translate(${rx},${ry})`}
                      style={{ transition: "transform 600ms cubic-bezier(.4,0,.2,1)", cursor: "pointer" }}
                      onMouseEnter={() => setHoveredNode(name)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onTouchStart={() => setHoveredNode(name)}
                    >
                      <circle
                        r={radiusFor(name)}
                        fill={fillFor(name)}
                        opacity={opacityFor(name)}
                        stroke="var(--paper-raised)"
                        strokeWidth={1.5}
                        style={{
                          transition:
                            "r 400ms ease, opacity 400ms ease, fill 400ms ease",
                        }}
                      />
                      {/* Text Halo / Stroke for better legibility when overlapping */}
                      <text
                        x={0}
                        y={-radiusFor(name) - 6}
                        textAnchor="middle"
                        fontSize={isHighlight || isHovered ? 11 : 9}
                        fill="none"
                        stroke="white"
                        strokeWidth={3}
                        strokeLinejoin="round"
                        opacity={showLabel ? 1 : 0}
                        style={{ transition: "opacity 400ms ease, font-size 400ms ease" }}
                      >
                        {shortName(name)}
                      </text>
                      {/* Main Text */}
                      <text
                        x={0}
                        y={-radiusFor(name) - 6}
                        textAnchor="middle"
                        fontSize={isHighlight || isHovered ? 11 : 9}
                        fill={isHighlight || isHovered ? "var(--brass-bright)" : "var(--ink-dim)"}
                        opacity={showLabel ? 1 : 0}
                        style={{ transition: "opacity 400ms ease, font-size 400ms ease" }}
                      >
                        {shortName(name)}
                      </text>
                      {(isHighlight || isHovered) && (
                        <text
                          x={0}
                          y={radiusFor(name) + 16}
                          textAnchor="middle"
                          fontSize={10}
                          fill="var(--ink)"
                        >
                          {`R ${getVal(name, "rural", YEAR_LATE).toFixed(0)}% · U ${getVal(
                            name,
                            "urban",
                            YEAR_LATE
                          ).toFixed(0)}%`}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* axis labels */}
                <text
                  x={innerW / 2}
                  y={innerH + 40}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill="var(--ink-dim)"
                >
                  RURAL (%)
                </text>
                <text
                  transform={`translate(${-42},${innerH / 2}) rotate(-90)`}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill="var(--ink-dim)"
                >
                  URBAN (%)
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Scroll steps */}
        {allStepsWithMeta.map((step, i) => (
          <div
            key={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            data-step-index={i}
            className={`min-h-[calc(100vh-4rem)] flex items-end pb-24 md:pb-0 md:items-center relative z-20 pointer-events-none px-2 sm:px-4 justify-center ${
              i === 0 ? "-mt-[calc(100vh-4rem)]" : ""
            } ${step.align === "left" ? "md:justify-start" : "md:justify-end"}`}
          >
            <div
              className={`chart-paper rounded-lg p-5 sm:p-6 max-w-sm shadow-2xl pointer-events-auto transition-all duration-300 ${
                currentStep === i
                  ? "border-brass-bright scale-[1.03] opacity-100 bg-white"
                  : "opacity-60"
              }`}
            >
              <span className="text-[10px] tracking-[0.15em] text-brass-bright font-bold">
                {step.kicker}
              </span>
              <p className="mt-2 text-sm sm:text-[15px] text-ink leading-relaxed">
                {step.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-6xl pt-6 sm:pt-10">
        <SourceNote className="text-primary text-xs">
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

      {/* <div className="mx-auto max-w-6xl pt-6 sm:pt-10">
        <p className="font-mono text-[11px] text-ink-faint leading-relaxed max-w-2xl">
          Note: Countries without both urban and rural disaggregated reporting are not shown in this chart.
        </p>
      </div> */}
    </section>
  );
}