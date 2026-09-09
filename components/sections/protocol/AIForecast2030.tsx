"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import forecastsData from "@/data/protocol/forecasts.json";

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
      <div className="flex h-[360px] w-full items-center justify-center rounded-lg border border-foam/10">
        <span className="font-data text-xs text-foam/40">Loading AI forecast...</span>
      </div>
    ),
  }
);

const countries = Object.entries(forecastsData.countries).map(([iso2, data]) => ({
  iso2,
  name: data.name,
}));

export function AIForecast2030() {
  const defaultIso = "TV" in forecastsData.countries ? "TV" : countries[0].iso2;
  const [selectedIso, setSelectedIso] = useState(defaultIso);
  const country = forecastsData.countries[selectedIso as keyof typeof forecastsData.countries];

  const histX = country.history_years;
  const histY = country.history_values;
  
  const fX = country.trigger_forecast.forecast_years;
  const fMean = country.trigger_forecast.mean;
  const fLo80 = country.trigger_forecast.lo80;
  const fHi80 = country.trigger_forecast.hi80;
  
  // Combine last history point to forecast to make the line continuous
  const combinedX = [histX[histX.length - 1], ...fX];
  const combinedMean = [histY[histY.length - 1], ...fMean];
  const combinedLo80 = [histY[histY.length - 1], ...fLo80];
  const combinedHi80 = [histY[histY.length - 1], ...fHi80];

  const layout = {
    margin: { l: 48, r: 16, b: 36, t: 12 },
    font: { family: "'Public Sans', ui-sans-serif, system-ui, sans-serif", color: "rgba(238,242,238,0.7)", size: 11 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    xaxis: {
      type: "linear" as const,
      tickmode: "array" as const,
      tickvals: [2005, 2010, 2015, 2020, 2025, 2030],
      range: [2004, 2031],
      showgrid: false,
      zeroline: false,
      linecolor: "rgba(238,242,238,0.25)",
      tickfont: { family: "'IBM Plex Mono', ui-monospace, monospace", size: 11, color: "rgba(238,242,238,0.55)" },
    },
    yaxis: {
      title: { text: "Sea Level Anomaly (m)", font: { size: 11, color: "rgba(238,242,238,0.55)" } },
      gridcolor: "rgba(238,242,238,0.08)",
      zeroline: false,
      tickfont: { family: "'IBM Plex Mono', ui-monospace, monospace", size: 11, color: "rgba(238,242,238,0.55)" },
    },
    hoverlabel: {
      bgcolor: "rgba(10,30,40,0.95)",
      bordercolor: "rgba(238,242,238,0.2)",
      font: { color: "#eef2ee", family: "'Public Sans', ui-sans-serif, system-ui, sans-serif", size: 12 },
    },
    showlegend: false,
  };

  return (
    <div className="mt-20 border-t border-foam/10 pt-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6">
        <div>
          <h3 className="font-display text-2xl text-foam">AI Forecast to 2030</h3>
          <p className="mt-2 text-sm text-foam/70 max-w-2xl leading-relaxed">
            While the Smart Contract triggers payouts based on today's readings, the underlying AI engine continuously forecasts future risk. This statistical projection (with 80% confidence intervals) helps recalibrate the fund's risk allocation weights annually.
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-foam/60 border-t border-foam/10 pt-4">
            <div>
              <strong className="block text-foam/80 mb-1">Algorithm</strong>
              Bayesian Structural Time Series (BSTS) & ARIMA
            </div>
            <div>
              <strong className="block text-foam/80 mb-1">Input Features</strong>
              Historical Sea Level Anomalies, ENSO Index (1993-2023)
            </div>
            <div>
              <strong className="block text-foam/80 mb-1">Data Source</strong>
              Copernicus Climate Data Store, Pacific Data Hub
            </div>
            <div>
              <strong className="block text-foam/80 mb-1">Methodology Ref.</strong>
              IPCC AR6 WGI (Sea Level Projections)
            </div>
          </div>
        </div>
        <select 
          value={selectedIso}
          onChange={(e) => setSelectedIso(e.target.value)}
          className="mt-4 sm:mt-0 bg-ocean-mid text-foam border border-foam/20 rounded px-3 py-1.5 text-sm font-data focus:outline-none focus:border-lagoon"
        >
          {countries.map(c => (
            <option key={c.iso2} value={c.iso2}>{c.name}</option>
          ))}
        </select>
      </div>

      <Plot
        data={[
          // Confidence Interval (Shaded Area)
          {
            x: [...combinedX, ...combinedX.slice().reverse()],
            y: [...combinedHi80, ...combinedLo80.slice().reverse()],
            fill: "toself",
            fillcolor: "rgba(201, 91, 50, 0.15)", // coral with low opacity
            line: { color: "transparent" },
            name: "80% Confidence",
            hoverinfo: "skip"
          },
          // Historical Data
          {
            x: histX,
            y: histY,
            type: "scatter",
            mode: "lines+markers",
            line: { color: "#c2d8c6", width: 2 }, // lagoon-soft
            marker: { size: 4, color: "#c2d8c6" },
            name: "History",
            hovertemplate: "%{x}: %{y:.3f}m<extra></extra>"
          },
          // Forecast Mean
          {
            x: combinedX,
            y: combinedMean,
            type: "scatter",
            mode: "lines",
            line: { color: "#c95b32", width: 2, dash: "dot" }, // coral dashed
            name: "Forecast Mean",
            hovertemplate: "%{x}: %{y:.3f}m<extra></extra>"
          }
        ]}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", height: "360px" }}
      />
    </div>
  );
}
