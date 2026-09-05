import json
import pandas as pd
from pathlib import Path

SRC = "data/pacific_data_all.xlsx"
OUT = Path("data")

# 13 Pacific Island Countries target
TARGET_CODES = {"CK", "FM", "MIC", "FJ", "KI", "NR", "NU", "PW", "MH", "WS", "SB", "TO", "TV", "VU"}

# Canonical names for each code
CODE_TO_NAME = {
    "CK": "Cook Islands",
    "FM": "Federated States of Micronesia",
    "MIC": "Federated States of Micronesia",
    "FJ": "Fiji",
    "KI": "Kiribati",
    "NR": "Nauru",
    "NU": "Niue",
    "PW": "Palau",
    "MH": "Republic of Marshall Islands",
    "WS": "Samoa",
    "SB": "Solomon Islands",
    "TO": "Tonga",
    "TV": "Tuvalu",
    "VU": "Vanuatu",
}

# ISO2 codes mapping
CODE_TO_ISO2 = {
    "CK": "CK", "FM": "FM", "MIC": "FM", "FJ": "FJ", "KI": "KI",
    "NR": "NR", "NU": "NU", "PW": "PW", "MH": "MH",
    "WS": "WS", "SB": "SB", "TO": "TO", "TV": "TV", "VU": "VU",
}

# Approximate coordinates (lat, lon)
CENTROIDS = {
    "CK": (-21.2367, -159.7777),
    "FM": (6.9248, 158.1611),
    "MIC": (6.9248, 158.1611),
    "FJ": (-17.7134, 178.0650),
    "KI": (1.4518, 172.9717),
    "NR": (-0.5228, 166.9315),
    "NU": (-19.0544, -169.8672),
    "PW": (7.5150, 134.5825),
    "MH": (7.1315, 171.1845),
    "WS": (-13.8506, -171.7513),
    "SB": (-9.4280, 159.9498),
    "TO": (-21.1789, -175.1982),
    "TV": (-8.5211, 179.1983),
    "VU": (-17.7333, 168.3222),
}

print(f"Reading {SRC}...")
df = pd.read_excel(SRC, sheet_name="Sheet1")
print(f"Total rows: {len(df)}")

# ---------------------------------------------------------------------------
# 1. GHG total (MtCO2e) - from pacific_ghg_yearly_worlddata, indicator=total_ghg
# ---------------------------------------------------------------------------
print("\n[1] Generating ghg_per_capita.json (ghg_per_capita)...")

ghg_raw = df[
    (df["dataset"] == "CLIMATE_CHANGE_GHG_INDICATORS") &
    (df["indicator_id"] == "GHG_EMI_CAPITA") &
    (df["geo_pict"].isin(TARGET_CODES))
].dropna(subset=["value"]).sort_values(["geo_pict", "year"])

ghg_out = []
for code, g in ghg_raw.groupby("geo_pict"):
    lat, lon = CENTROIDS.get(code, (0, 0))
    name = CODE_TO_NAME[code]
    series = [{"year": int(r.year), "value": round(float(r.value), 4)} for r in g.itertuples()]
    if not series:
        continue
    latest = series[-1]
    ghg_out.append({
        "code": code,
        "name": name,
        "lat": lat,
        "lon": lon,
        "latest_year": latest["year"],
        "latest_value": latest["value"],
        "series": series,
    })

with open(OUT / "ghg_per_capita.json", "w", encoding="utf-8") as f:
    json.dump(ghg_out, f, indent=1)
print(f"  -> {len(ghg_out)} countries")
if ghg_out:
    print(f"     sample years: {ghg_out[0]['series'][0]['year']} - {ghg_out[0]['series'][-1]['year']}")

# ---------------------------------------------------------------------------
# 2. Sea Level (SLA - sea level anomaly, from pacific_sla_monthly_satelite)
# ---------------------------------------------------------------------------
print("\n[2] Generating sea_level.json...")

sea_raw = df[
    (df["dataset"] == "pacific_sla_monthly_satelite") &
    (df["indicator_id"] == "SLA") &
    (df["geo_pict"].isin(TARGET_CODES))
].dropna(subset=["value"])

# Data is monthly, so we group by country and year, then take the mean
sea_yearly = sea_raw.groupby(["geo_pict", "year"])["value"].mean().reset_index().sort_values(["geo_pict", "year"])

sea_out_dict = {}
sea_out_list = []

for code, g in sea_yearly.groupby("geo_pict"):
    lat, lon = CENTROIDS.get(code, (0, 0))
    name = CODE_TO_NAME[code]
    iso2 = CODE_TO_ISO2[code]
    series = [{"year": int(r.year), "value": round(float(r.value), 4)} for r in g.itertuples()]
    if not series:
        continue
    sea_out_dict[name] = {"iso2": iso2, "series": series}
    sea_out_list.append({"code": code, "name": name, "series": series})

with open(OUT / "sea_level.json", "w", encoding="utf-8") as f:
    json.dump(sea_out_dict, f, indent=1)

# Pacific average (unweighted)
pacific_avg = sea_yearly.groupby("year")["value"].mean().round(4).reset_index()
avg_list = [{"year": int(r.year), "value": float(r.value)} for r in pacific_avg.itertuples()]
with open(OUT / "sea_level_pacific_avg.json", "w", encoding="utf-8") as f:
    json.dump(avg_list, f, indent=1)

print(f"  -> {len(sea_out_dict)} countries")
if sea_out_list:
    s = sea_out_list[0]["series"]
    print(f"     sample years: {s[0]['year']} - {s[-1]['year']}")

# ---------------------------------------------------------------------------
# 3. Temperature anomaly (ST_ANOM)
# ---------------------------------------------------------------------------
print("\n[3] Generating temperature_anomaly.json...")

temp_raw = df[
    (df["dataset"] == "CLIMATE_CHANGE_TEMP_INDICATORS") &
    (df["indicator_id"] == "ST_ANOM") &
    (df["geo_pict"].isin(TARGET_CODES))
].dropna(subset=["value"]).sort_values(["geo_pict", "year"])

temp_out = []
for code, g in temp_raw.groupby("geo_pict"):
    lat, lon = CENTROIDS.get(code, (0, 0))
    name = CODE_TO_NAME[code]
    series = [{"year": int(r.year), "value": round(float(r.value), 3)} for r in g.itertuples()]
    if not series:
        continue
    latest = series[-1]
    gg = g.copy()
    gg["decade"] = (gg["year"] // 10) * 10
    dec = gg.groupby("decade")["value"].mean().round(3)
    decades = [{"decade": int(d), "value": float(v)} for d, v in dec.items()]
    temp_out.append({
        "code": code,
        "name": name,
        "lat": lat,
        "lon": lon,
        "latest_year": latest["year"],
        "latest_value": latest["value"],
        "decades": decades,
        "series": series,
    })

with open(OUT / "temperature_anomaly.json", "w", encoding="utf-8") as f:
    json.dump(temp_out, f, indent=1)

# Pacific average
temp_avg = temp_raw.groupby("year")["value"].mean().round(3).reset_index()
avg_temp_list = [{"year": int(r.year), "value": float(r.value)} for r in temp_avg.itertuples()]
with open(OUT / "temperature_pacific_avg.json", "w", encoding="utf-8") as f:
    json.dump(avg_temp_list, f, indent=1)

print(f"  -> {len(temp_out)} countries")

# ---------------------------------------------------------------------------
# 4. Clean water (4 main indicators, region: _T=total, U=urban, R=rural)
# ---------------------------------------------------------------------------
print("\n[4] Generating clean_water.json + clean_water_full.json...")

WATER_INDICATORS = {
    "SH_H2O_SAFE": {
        "label": "Nước uống được quản lý an toàn",
        "desc": "Proportion of population using safely managed drinking water services [6.1.1]",
        "polarity": "good",
    },
    "SH_SAN_HNDWSH": {
        "label": "Có nơi rửa tay cơ bản tại nhà",
        "desc": "Proportion of population with basic handwashing facilities on premises [6.2.1]",
        "polarity": "good",
    },
    "SH_SAN_DEFECT": {
        "label": "Đi vệ sinh lộ thiên (phóng uế bừa bãi)",
        "desc": "Proportion of population practicing open defecation [6.2.1]",
        "polarity": "bad",
    },
    "SH_SAN_SAFE": {
        "label": "Vệ sinh được quản lý an toàn",
        "desc": "Proportion of population using safely managed sanitation services [6.2.1]",
        "polarity": "good",
    },
}

water_raw = df[
    (df["dataset"] == "CLEAN_WATER") &
    (df["indicator_id"].isin(WATER_INDICATORS.keys())) &
    (df["geo_pict"].isin(TARGET_CODES))
].dropna(subset=["value"])

print(f"  Water codes in data: {sorted(water_raw['geo_pict'].unique())}")

# Build clean_water.json (SH_H2O_SAFE only)
h2o_raw = water_raw[water_raw["indicator_id"] == "SH_H2O_SAFE"]

clean_water_dict = {}
for code, g in h2o_raw.groupby("geo_pict"):
    if code not in TARGET_CODES:
        continue
    name = CODE_TO_NAME[code]
    iso2 = CODE_TO_ISO2[code]
    total = [{"year": int(r.year), "value": round(float(r.value), 2)}
             for r in g[g["region"] == "_T"].sort_values("year").itertuples()]
    urban = [{"year": int(r.year), "value": round(float(r.value), 2)}
             for r in g[g["region"] == "U"].sort_values("year").itertuples()]
    rural = [{"year": int(r.year), "value": round(float(r.value), 2)}
             for r in g[g["region"] == "R"].sort_values("year").itertuples()]
    clean_water_dict[name] = {"iso2": iso2, "total": total, "urban": urban, "rural": rural}

with open(OUT / "clean_water.json", "w", encoding="utf-8") as f:
    json.dump(clean_water_dict, f, indent=1)
print(f"  -> clean_water.json: {len(clean_water_dict)} countries")

# Build clean_water_full.json (all 4 indicators)
all_years_set = set()
for y in water_raw["year"].unique():
    all_years_set.add(int(y))
all_years = sorted(all_years_set)

clean_water_full = {}
for ind_id, ind_meta in WATER_INDICATORS.items():
    ind_raw = water_raw[water_raw["indicator_id"] == ind_id]
    countries_dict = {}
    for code, g in ind_raw.groupby("geo_pict"):
        if code not in TARGET_CODES:
            continue
        name = CODE_TO_NAME[code]
        iso2 = CODE_TO_ISO2[code]
        total = [{"year": int(r.year), "value": round(float(r.value), 2)}
                 for r in g[g["region"] == "_T"].sort_values("year").itertuples()]
        urban = [{"year": int(r.year), "value": round(float(r.value), 2)}
                 for r in g[g["region"] == "U"].sort_values("year").itertuples()]
        rural = [{"year": int(r.year), "value": round(float(r.value), 2)}
                 for r in g[g["region"] == "R"].sort_values("year").itertuples()]
        countries_dict[name] = {"iso2": iso2, "total": total, "urban": urban, "rural": rural}

    clean_water_full[ind_id] = {
        "id": ind_id,
        "label": ind_meta["label"],
        "desc": ind_meta["desc"],
        "polarity": ind_meta["polarity"],
        "years": all_years,
        "countries": countries_dict,
    }

with open(OUT / "clean_water_full.json", "w", encoding="utf-8") as f:
    json.dump(clean_water_full, f, indent=1)
print(f"  -> clean_water_full.json: {len(WATER_INDICATORS)} indicators")
print(f"     Countries: {list(list(clean_water_full.values())[0]['countries'].keys())}")

print("\n[Done] All JSON files generated.")
print(f"  GHG: {[d['name'] for d in ghg_out]}")
print(f"  Sea level: {list(sea_out_dict.keys())}")
print(f"  Temp: {[d['name'] for d in temp_out]}")
print(f"  Clean water: {list(clean_water_dict.keys())}")
