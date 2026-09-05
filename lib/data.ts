import seaLevelRaw from "@/data/sea_level.json";
import cleanWaterRaw from "@/data/clean_water.json";
import cleanWaterFullRaw from "@/data/clean_water_full.json";
import correlationRaw from "@/data/correlation_matrix.json";
import ghgRaw from "@/data/ghg_per_capita.json";
import tempAnomalyRaw from "@/data/temperature_anomaly.json";
import picCountriesRaw from "@/data/pic_countries.json";

export interface YearValue {
  year: number;
  value: number;
}

export interface SeaLevelCountry {
  iso2: string;
  series: YearValue[];
}

export interface CleanWaterCountry {
  iso2: string;
  total: YearValue[];
  urban: YearValue[];
  rural: YearValue[];
}

export const TARGET_PICS = [
  "Cook Islands",
  "Federated States of Micronesia",
  "Fiji",
  "Kiribati",
  "Nauru",
  "Niue",
  "Palau",
  "Republic of Marshall Islands",
  "Samoa",
  "Solomon Islands",
  "Tonga",
  "Tuvalu",
  "Vanuatu",
  // Legacy / alternate name forms kept for backward compat with older JSON files
  "Micronesia",
  "Micronesia, Federated State of",
  "Marshall Islands",
];

export const isTargetPic = (name: string) => TARGET_PICS.includes(name);

export const seaLevelData = Object.fromEntries(
  Object.entries(seaLevelRaw as Record<string, SeaLevelCountry>).filter(([name]) => isTargetPic(name))
);
export const cleanWaterData = Object.fromEntries(
  Object.entries(cleanWaterRaw as Record<string, CleanWaterCountry>).filter(([name]) => isTargetPic(name))
);

export const seaLevelCountries = Object.keys(seaLevelData).sort((a, b) => a.localeCompare(b));
export const cleanWaterCountries = Object.keys(cleanWaterData).sort((a, b) => a.localeCompare(b));

// Sea level years: all data from 1993 onward (full range for Sea Level Race chart)
export const seaLevelYears = Array.from(
  new Set(
    Object.values(seaLevelData).flatMap((c) => c.series.map((s) => s.year))
  )
).filter((y) => y >= 2005 && y <= 2024).sort((a, b) => a - b);

export const cleanWaterYears = Array.from(
  new Set(
    Object.values(cleanWaterData).flatMap((c) => c.total.map((s) => s.year))
  )
).sort((a, b) => a - b);

/** Shorten a few long country names for tight chart labels. */
export const shortName = (name: string): string => {
  const map: Record<string, string> = {
    "Federated States of Micronesia": "Micronesia",
    "Republic of Marshall Islands": "Marshall Islands",
    "Micronesia, Federated State of": "Micronesia",
    "Northern Mariana Islands": "N. Mariana Is.",
    "Wallis and Futuna": "Wallis & Futuna",
  };
  return map[name] ?? name;
};

// ---- Full multi-indicator clean-water dataset ----

export interface IndicatorCountry {
  iso2: string;
  total: YearValue[];
  urban: YearValue[];
  rural: YearValue[];
}

export interface IndicatorDef {
  id: string;
  label: string;
  desc: string;
  polarity: "good" | "bad";
  years: number[];
  countries: Record<string, IndicatorCountry>;
}

export const cleanWaterFull = Object.fromEntries(
  Object.entries(cleanWaterFullRaw as Record<string, IndicatorDef>).map(([id, def]) => {
    const filteredCountries = Object.fromEntries(
      Object.entries(def.countries).filter(([name]) => isTargetPic(name))
    );
    return [id, { ...def, countries: filteredCountries }];
  })
) as Record<string, IndicatorDef>;
export const indicatorIds = ["SH_H2O_SAFE", "SH_SAN_DEFECT", "SH_SAN_HNDWSH"];
export const ALL_INDICATOR_YEARS = cleanWaterFull[indicatorIds[0]].years;

// ---- Rolling correlation matrix (sea level x clean-water indicators) ----

export interface CorrelationMatrixData {
  years: number[];
  variables: string[];
  varLabels: Record<string, string>;
  windowSize: number;
  minPoints: number;
  regionalMeans: Record<string, Record<string, number | null>>;
  matrices: Record<
    string,
    { r: (number | null)[][]; windowYears: number[]; n: number }
  >;
}

export const correlationMatrix = correlationRaw as CorrelationMatrixData;

// Label translations for Vietnamese indicators
export const INDICATOR_LABEL_MAP: Record<string, string> = {
  "Nước uống được quản lý an toàn": "Safely managed drinking water",
  "Có nơi rửa tay cơ bản tại nhà": "Basic handwashing facilities",
  "Vệ sinh được quản lý an toàn": "Safely managed sanitation",
  "Đi vệ sinh lộ thiên (phóng uế bừa bãi)": "Open defecation",
  // Correlation matrix labels
  "Mực nước biển": "Sea level",
  "Nước uống an toàn": "Safe drinking water",
  "Rửa tay cơ bản": "Basic handwashing",
  "Vệ sinh lộ thiên": "Open defecation",
  "Vệ sinh an toàn": "Safe sanitation"
};

/** Get translated label for an indicator */
export const getIndicatorLabel = (vietnameseLabel: string): string => {
  return INDICATOR_LABEL_MAP[vietnameseLabel] || vietnameseLabel;
};

/** Countries that have a "total" series for every clean-water indicator —
 * the only ones comparable across all axes of the radar chart. */
export const radarCountries = Object.keys(
  cleanWaterFull[indicatorIds[0]].countries
).filter((name) =>
  indicatorIds.every((id) => {
    const c = cleanWaterFull[id].countries[name];
    return c && c.total.length > 0;
  })
).sort((a, b) => a.localeCompare(b));

export const radarCountryIso2 = (name: string): string =>
  cleanWaterFull[indicatorIds[0]].countries[name]?.iso2 ??
  Object.values(cleanWaterFull)
    .map((ind) => ind.countries[name]?.iso2)
    .find(Boolean) ??
  "un";

// ---- Sparse supplementary indicator (EN_WWT_WWDS) ----
import wwdsRaw from "@/data/wwds_snapshot.json";
export interface WwdsRow {
  name: string;
  iso2: string;
  year: number;
  value: number;
}
export const wwdsSnapshot = (wwdsRaw as WwdsRow[]).filter((r) => isTargetPic(r.name));
export const wwdsYears = Array.from(new Set(wwdsSnapshot.map((r) => r.year))).sort(
  (a, b) => a - b
);

// ---- GHG per capita dataset (GHG_EMI_CAPITA, Tons) ----
export interface GhgCountry {
  code: string;
  name: string;
  lat: number;
  lon: number;
  latest_year: number;
  latest_value: number;
  series: YearValue[];
}

export const ghgData = (ghgRaw as GhgCountry[]).filter((r) => isTargetPic(r.name));
export const ghgLatestYear = ghgData.length > 0 ? Math.max(...ghgData.map(c => c.latest_year)) : 2024;

// ---- Temperature anomaly dataset (per country, yearly series) ----
export interface TempCountry {
  code: string;
  name: string;
  lat: number;
  lon: number;
  latest_year: number;
  latest_value: number;
  decades: { decade: number; value: number }[];
  series: YearValue[];
}

export const tempAnomalyData = (tempAnomalyRaw as TempCountry[]).filter((r) => isTargetPic(r.name));

// Common years across sea level, GHG, temperature (2016 to latest GHG year)
export const CORRELATION_YEARS = Array.from({ length: Math.max(1, ghgLatestYear - 2016 + 1) }, (_, i) => 2016 + i);

// GHG data range constants
export const GHG_SERIES_START_YEAR = 1990;
export const SEA_LEVEL_START_YEAR = 1993; // earliest data in dataset

export const picCoords = (picCountriesRaw as Array<{ code: string; name: string; lat: number; lon: number }>).filter(p => isTargetPic(p.name));
