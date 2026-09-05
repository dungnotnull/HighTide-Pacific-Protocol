"""Extract the official PDH long-term sea-level indicator (1993-2023, meters)."""

import pandas as pd


def extract_trend_series(xlsx_path):
    """Return {country_name: {iso2, years, values}} from
    CLIMATE_CHANGE_SEA_INDICATORS, same shape as load_sea_level output."""
    df = pd.read_excel(xlsx_path, sheet_name="Sheet1")
    rows = df[df["dataset"] == "CLIMATE_CHANGE_SEA_INDICATORS"]
    trend = {}
    for _, group in rows.groupby("geo_name"):
        group = group.sort_values("year")
        iso2 = group["geo_pict"].iloc[0]
        name = group["geo_name"].iloc[0]
        trend[str(name)] = {
            "iso2": str(iso2),
            "years": [int(y) for y in group["year"]],
            "values": [float(v) for v in group["value"]],
        }
    return trend
