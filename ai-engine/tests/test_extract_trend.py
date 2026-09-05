from pathlib import Path

from hightide.extract import extract_trend_series
from hightide.load import REPO_ROOT

XLSX = REPO_ROOT / "data" / "pacific_data_all.xlsx"
TRIGGER_ISO2 = {"CK", "FJ", "FM", "KI", "MH", "NR", "NU", "PW", "SB", "TO", "TV", "VU", "WS"}


def test_extract_trend_series_from_real_excel():
    trend = extract_trend_series(XLSX)
    iso2_set = {entry["iso2"] for entry in trend.values()}
    assert TRIGGER_ISO2.issubset(iso2_set), "all 13 trigger countries must have trend data"
    tv = trend["Tuvalu"]
    assert tv["years"][0] == 1993 and tv["years"][-1] == 2023
    assert len(tv["years"]) == 31
    # official PDH indicator is reported at 0.1 m resolution
    assert all(abs(round(v * 10) - v * 10) < 1e-9 for v in tv["values"])
