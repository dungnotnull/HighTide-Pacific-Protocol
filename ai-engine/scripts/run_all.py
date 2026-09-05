"""CLI entry: python ai-engine/scripts/run_all.py"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from hightide.pipeline import run_pipeline  # noqa: E402


def main():
    outputs = run_pipeline()
    report = outputs["backtest_report"]
    print("Chosen params: k =", report["k"], "| N =", report["n_consecutive"])
    print("Events:", report["summary"]["total_events"])
    print("ENSO window events:", report["summary"]["enso_window_events"])
    print("Hypothetical payouts (USD):", report["summary"]["total_payout_usd"])
    for ev in report["events"]:
        print(
            f"  {ev['iso2']} {ev['start_year']}-{ev['end_year']} "
            f"peak_z={ev['peak_z']} tier={ev['tier_payout_fraction']} "
            f"payout=${ev['payout_usd']:,.0f}"
        )


if __name__ == "__main__":
    main()
