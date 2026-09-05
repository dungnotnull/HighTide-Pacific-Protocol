# Data Files Notes

This file contains notes for each data JSON file, indicating their source, status, and what needs to be done before submission.

---

## sea_level.json
**Status**: DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_SEA_INDICATORS)
**Source**: Pacific Data Hub, dataset `CLIMATE_CHANGE_SEA_INDICATORS`
**Description**: Meters, relative sea-level change, 21 PICTs, 1993–2023
**Action needed**: Extract real data from Excel sheet `CLIMATE_CHANGE_SEA_INDICATORS` and replace this file

---

## sea_level_pacific_avg.json
**Status**: DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_SEA_INDICATORS - unweighted Pacific average)
**Source**: Pacific Data Hub, dataset `CLIMATE_CHANGE_SEA_INDICATORS`
**Description**: Unweighted mean across reporting PICTs per year - a simple cross-country average for a headline line, not a tide-gauge-weighted regional index
**Action needed**: Calculate unweighted Pacific average from real sea level data

---

## ghg_per_capita.json
**Status**: DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_GHG_INDICATORS)
**Source**: Pacific Data Hub, dataset `CLIMATE_CHANGE_GHG_INDICATORS`
**Description**: Tons CO2 per capita, 17 PICTs, 1970–2024
**Note**: Palau (86.7 t) and New Caledonia (18.4 t) are genuine reported outliers - Palau's figure reflects its large international ship registry / bunker fuel accounting, New Caledonia's reflects nickel-processing industry, not typical household consumption. Flag both in the UI rather than hiding them.
**Action needed**: Extract real data from Excel sheet `CLIMATE_CHANGE_GHG_INDICATORS`

---

## temperature_anomaly.json
**Status**: DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_TEMP_INDICATORS)
**Source**: Pacific Data Hub, dataset `CLIMATE_CHANGE_TEMP_INDICATORS`
**Description**: Degrees Celsius anomaly vs. baseline, 22 PICTs, 1850–2025
**Action needed**: Extract real data from Excel sheet `CLIMATE_CHANGE_TEMP_INDICATORS`

---

## temperature_pacific_avg.json
**Status**: DUMMY DATA - Replace with actual data from all_data_v1.xlsx (CLIMATE_CHANGE_TEMP_INDICATORS - unweighted Pacific average)
**Source**: Pacific Data Hub, dataset `CLIMATE_CHANGE_TEMP_INDICATORS`
**Description**: Unweighted cross-country mean per year
**Action needed**: Calculate unweighted Pacific average from real temperature data

---

## emitters_context.json
**Status**: ILLUSTRATIVE DATA - Approximate global emitter comparisons for context
**Source**: Global Carbon Project / Our World in Data, CO2 emissions per capita, 2023 (approximate)
**Note**: Not part of the official Pacific Data Hub extract - used only as outside context to size the PICs-vs-major-emitters gap. Figures are approximate/illustrative; replace with the team's own preferred comparator set if desired.
**Action needed**: Replace with verified data before submission

---

## migration_placeholder.json
**Status**: FULLY PLACEHOLDER DATA - DO NOT USE
**Source**: Placeholder based on IOM Asia-Pacific Migration Data Portal structure
**Note**: Loosely modeled on the shape of data available on the IOM Asia-Pacific Migration Data Portal (https://ap-migrationdata.iom.int/en), but every number is invented and must be replaced before submission. Do not cite this file's figures as real in the final entry.
**Action needed**: **CRITICAL** - Replace with actual migration analysis before submission

---

## countries-50m.json
**Status**: Not created yet
**Source**: world-atlas npm package (Natural Earth 1:50m, public domain)
**Description**: Basemap land/country outlines only, used for geographic context on the Cause section map
**Action needed**: Install world-atlas package and generate this file if needed
