import json
import pandas as pd
from pathlib import Path

SRC = "/mnt/user-data/uploads/all_data_v1.xlsx"
OUT = Path("/home/claude/pacific-story/data-src")
OUT.mkdir(exist_ok=True)

# Approximate centroid (capital / main atoll) coordinates for each Pacific
# Island Country/Territory (PICT) code appearing in the Pacific Data Hub sheets.
CENTROIDS = {
    "AS": ("American Samoa", -14.2710, -170.1322),
    "CK": ("Cook Islands", -21.2367, -159.7777),
    "FJ": ("Fiji", -17.7134, 178.0650),
    "FM": ("Micronesia, FS", 6.9248, 158.1611),
    "GU": ("Guam", 13.4443, 144.7937),
    "KI": ("Kiribati", 1.4518, 172.9717),
    "MH": ("Marshall Islands", 7.1315, 171.1845),
    "MP": ("N. Mariana Islands", 15.0979, 145.6739),
    "NC": ("New Caledonia", -21.5000, 165.5000),
    "NR": ("Nauru", -0.5228, 166.9315),
    "NU": ("Niue", -19.0544, -169.8672),
    "PF": ("French Polynesia", -17.6797, -149.4068),
    "PG": ("Papua New Guinea", -9.4438, 147.1803),
    "PN": ("Pitcairn Islands", -25.0667, -130.1000),
    "PW": ("Palau", 7.5150, 134.5825),
    "SB": ("Solomon Islands", -9.4280, 159.9498),
    "TK": ("Tokelau", -9.2002, -171.8484),
    "TO": ("Tonga", -21.1789, -175.1982),
    "TV": ("Tuvalu", -8.5211, 179.1983),
    "VU": ("Vanuatu", -17.7333, 168.3222),
    "WF": ("Wallis and Futuna", -13.7688, -177.1561),
    "WS": ("Samoa", -13.8506, -171.7513),
}

xl = pd.ExcelFile(SRC)

# ---------------------------------------------------------------------------
# 1. Sea level (meters, relative change), 1993-2023
# ---------------------------------------------------------------------------
sea = xl.parse("CLIMATE_CHANGE_SEA_INDICATORS")[["geo_pict", "geo_name", "year", "value"]]
sea = sea.dropna(subset=["value"]).sort_values(["geo_pict", "year"])

sea_out = []
for code, g in sea.groupby("geo_pict"):
    name, lat, lon = CENTROIDS.get(code, (g["geo_name"].iloc[0], None, None))
    series = [{"year": int(r.year), "value": round(float(r.value), 3)} for r in g.itertuples()]
    sea_out.append({"code": code, "name": name, "lat": lat, "lon": lon, "series": series})

with open(OUT / "sea_level.json", "w") as f:
    json.dump(sea_out, f, indent=1)

# Pacific-wide simple average per year (unweighted mean across reporting PICTs) --
# used for the headline trend line. Clearly an unweighted cross-country mean,
# not a tide-gauge-weighted regional index; noted as such in the UI copy.
pacific_avg = (
    sea.groupby("year")["value"].mean().round(3).reset_index().rename(columns={"value": "value"})
)
with open(OUT / "sea_level_pacific_avg.json", "w") as f:
    json.dump(pacific_avg.to_dict("records"), f, indent=1)

# ---------------------------------------------------------------------------
# 2. GHG per-capita CO2 (tons), 1970-2024
# ---------------------------------------------------------------------------
ghg = xl.parse("CLIMATE_CHANGE_GHG_INDICATORS")[["geo_pict", "geo_name", "year", "value"]]
ghg = ghg.dropna(subset=["value"]).sort_values(["geo_pict", "year"])

ghg_out = []
for code, g in ghg.groupby("geo_pict"):
    name, lat, lon = CENTROIDS.get(code, (g["geo_name"].iloc[0], None, None))
    series = [{"year": int(r.year), "value": round(float(r.value), 2)} for r in g.itertuples()]
    latest = series[-1]
    ghg_out.append(
        {
            "code": code,
            "name": name,
            "lat": lat,
            "lon": lon,
            "latest_year": latest["year"],
            "latest_value": latest["value"],
            "series": series,
        }
    )

with open(OUT / "ghg_per_capita.json", "w") as f:
    json.dump(ghg_out, f, indent=1)

# ---------------------------------------------------------------------------
# 3. Temperature anomaly (°C vs. baseline), 1850-2025
# ---------------------------------------------------------------------------
temp = xl.parse("CLIMATE_CHANGE_TEMP_INDICATORS")[["geo_pict", "geo_name", "year", "value"]]
temp = temp.dropna(subset=["value"]).sort_values(["geo_pict", "year"])

temp_out = []
for code, g in temp.groupby("geo_pict"):
    name, lat, lon = CENTROIDS.get(code, (g["geo_name"].iloc[0], None, None))
    series = [{"year": int(r.year), "value": round(float(r.value), 2)} for r in g.itertuples()]
    latest = series[-1]
    # decade averages, useful for a compact heatmap without 175 columns
    gg = g.copy()
    gg["decade"] = (gg["year"] // 10) * 10
    dec = gg.groupby("decade")["value"].mean().round(2)
    decades = [{"decade": int(d), "value": float(v)} for d, v in dec.items()]
    temp_out.append(
        {
            "code": code,
            "name": name,
            "lat": lat,
            "lon": lon,
            "latest_year": latest["year"],
            "latest_value": latest["value"],
            "decades": decades,
            "series": series,
        }
    )

with open(OUT / "temperature_anomaly.json", "w") as f:
    json.dump(temp_out, f, indent=1)

# Pacific-wide simple average per year, for a headline trend line
temp_avg = temp.groupby("year")["value"].mean().round(3).reset_index()
with open(OUT / "temperature_pacific_avg.json", "w") as f:
    json.dump(temp_avg.to_dict("records"), f, indent=1)

print("Rows -> sea:", len(sea_out), "ghg:", len(ghg_out), "temp:", len(temp_out))
print("GHG latest range:", min(x["latest_value"] for x in ghg_out), "-", max(x["latest_value"] for x in ghg_out))