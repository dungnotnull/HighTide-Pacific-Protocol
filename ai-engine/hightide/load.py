"""Load Pacific Data Hub sea-level series for the HighTide protocol."""

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
OUTPUT_DIR = DATA_DIR / "protocol"

# Minimum annual observations for a country to qualify for allocation.
MIN_OBS = 15


def load_sea_level(path=None):
    """Return {iso2: {name, years: [int], values: [float]}}, sorted by year."""
    path = Path(path) if path else DATA_DIR / "sea_level.json"
    raw = json.loads(path.read_text(encoding="utf-8"))
    countries = {}
    for name, entry in raw.items():
        series = sorted(entry["series"], key=lambda point: point["year"])
        countries[entry["iso2"]] = {
            "name": name,
            "years": [point["year"] for point in series],
            "values": [point["value"] for point in series],
        }
    return countries
