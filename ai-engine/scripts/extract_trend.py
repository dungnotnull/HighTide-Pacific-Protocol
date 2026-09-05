"""CLI entry: python ai-engine/scripts/extract_trend.py"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from hightide.extract import extract_trend_series  # noqa: E402
from hightide.load import DATA_DIR  # noqa: E402


def main():
    trend = extract_trend_series(DATA_DIR / "pacific_data_all.xlsx")
    # reshape to {name: {iso2, series: [{year, value}]}} matching sea_level.json
    out = {
        name: {
            "iso2": entry["iso2"],
            "series": [
                {"year": y, "value": v}
                for y, v in zip(entry["years"], entry["values"])
            ],
        }
        for name, entry in trend.items()
    }
    path = DATA_DIR / "sea_level_trend.json"
    path.write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(f"Wrote {len(out)} countries to {path}")


if __name__ == "__main__":
    main()
