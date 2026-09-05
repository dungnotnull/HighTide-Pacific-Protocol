"use client";

import dynamic from "next/dynamic";
import backtestReport from "@/data/protocol/backtest_report.json";
import { Cite } from "@/components/ui/Cite";

// Dynamically import react-plotly factory to avoid heavy plotly.js and SSR issues
const Plot = dynamic(
  () =>
    import("react-plotly.js/factory").then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Plotly = require("plotly.js-dist-min");
      return mod.default(Plotly);
    }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center rounded-lg border border-foam/10">
        <span className="font-data text-xs text-foam/40">Loading chart...</span>
      </div>
    ),
  }
);

interface BacktestEvent {
  iso2: string;
  name: string;
  start_year: number;
  end_year: number;
  peak_z: number;
  tier_payout_fraction: number;
  allocation_weight: number;
  payout_usd: number;
}

const events = backtestReport.events as BacktestEvent[];
const summary = backtestReport.summary;

// Multiple payouts can share an end year; spread bars within the year so all
// 13 remain visible while tick labels stay on integer years.
const yearCounts = events.reduce<Record<number, number>>((acc, e) => {
  acc[e.end_year] = (acc[e.end_year] ?? 0) + 1;
  return acc;
}, {});
const seen: Record<number, number> = {};
const xYears = events.map((e) => {
  const n = yearCounts[e.end_year];
  const i = seen[e.end_year] ?? 0;
  seen[e.end_year] = i + 1;
  return n === 1 ? e.end_year : e.end_year + (i - (n - 1) / 2) * 0.3;
});
const yPayouts = events.map((e) => e.payout_usd / 1e6);
const hoverTexts = events.map(
  (e) =>
    `${e.name}<br>peak z = ${e.peak_z.toFixed(2)}σ · tier ${(e.tier_payout_fraction * 100).toFixed(0)}%<br>payout $${e.payout_usd.toLocaleString("en-US")}`
);

const layout = {
  margin: { l: 48, r: 16, b: 36, t: 12 },
  font: { family: "'Public Sans', ui-sans-serif, system-ui, sans-serif", color: "rgba(238,242,238,0.7)", size: 11 },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  barmode: "overlay" as const,
  bargap: 0.25,
  xaxis: {
    type: "linear" as const,
    tickmode: "array" as const,
    tickvals: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    range: [2017.4, 2025.6],
    showgrid: false,
    zeroline: false,
    linecolor: "rgba(238,242,238,0.25)",
    tickfont: { family: "'IBM Plex Mono', ui-monospace, monospace", size: 11, color: "rgba(238,242,238,0.55)" },
  },
  yaxis: {
    title: { text: "Payout ($M)", font: { size: 11, color: "rgba(238,242,238,0.55)" } },
    gridcolor: "rgba(238,242,238,0.08)",
    zeroline: false,
    tickfont: { family: "'IBM Plex Mono', ui-monospace, monospace", size: 11, color: "rgba(238,242,238,0.55)" },
  },
  // Shaded 2020-2022 triple-dip La Nina window
  shapes: [
    {
      type: "rect" as const,
      xref: "x" as const,
      yref: "paper" as const,
      x0: 2019.6,
      x1: 2022.4,
      y0: 0,
      y1: 1,
      fillcolor: "rgba(44,122,121,0.22)",
      line: { width: 0 },
      layer: "below" as const,
    },
  ],
  annotations: [
    {
      xref: "x" as const,
      yref: "paper" as const,
      x: 2021,
      y: 1.04,
      text: "La Nina highs",
      showarrow: false,
      font: { family: "'IBM Plex Mono', ui-monospace, monospace", size: 10, color: "rgba(188,216,211,0.8)" },
    },
  ],
  hoverlabel: {
    bgcolor: "rgba(10,30,40,0.95)",
    bordercolor: "rgba(238,242,238,0.2)",
    font: { color: "#eef2ee", family: "'Public Sans', ui-sans-serif, system-ui, sans-serif", size: 12 },
  },
  showlegend: false,
};

export function BacktestTimeline() {
  return (
    <div className="w-full">
      <p className="mb-2 font-data text-[12px] text-foam/70">
        {summary.total_events} payouts · {summary.enso_window_events} in ENSO window · $
        {(summary.total_payout_usd / 1e6).toFixed(1)}M total (mock pool $
        {(backtestReport.mock_pool_usd / 1e6).toFixed(0)}M/event)
      </p>
      <Plot
        data={[
          {
            type: "bar",
            x: xYears,
            y: yPayouts,
            text: hoverTexts,
            hoverinfo: "text",
            marker: { color: "var(--coral)", opacity: 0.85 },
            width: 0.28,
          },
        ]}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", height: "320px" }}
      />
      <p className="mt-3 font-data text-[11px] leading-relaxed text-foam/40">
        Backtest: trigger at z ≥ k=2.0σ for N={backtestReport.n_consecutive} consecutive reading;
        calibration 2005-2014, evaluation 2015-2025. Historic sea-level replay only - no live oracle.
      </p>
      <Cite ids={["IPCC6-CH9", "WIDLANSKY-2014", "PCRAFI", "ARC", "PDH-SEA"]} />
    </div>
  );
}
