import json

from hightide.load import load_sea_level, MIN_OBS


def _write(tmp_path, payload):
    p = tmp_path / "sea_level.json"
    p.write_text(json.dumps(payload), encoding="utf-8")
    return p


def test_load_returns_iso2_keyed_series(tmp_path):
    payload = {
        "Tuvalu": {
            "iso2": "TV",
            "series": [
                {"year": 2006, "value": 0.05},
                {"year": 2005, "value": 0.04},
            ],
        }
    }
    countries = load_sea_level(_write(tmp_path, payload))
    assert set(countries.keys()) == {"TV"}
    assert countries["TV"]["name"] == "Tuvalu"
    # sorted by year
    assert countries["TV"]["years"] == [2005, 2006]
    assert countries["TV"]["values"] == [0.04, 0.05]


def test_min_obs_constant():
    assert MIN_OBS == 15
