"""Eval harness. Discovers scenarios under ./scenarios/ and runs each through triagepack.reasoning.triage.

Day 4 lands the first 5 scenarios + the fixture wiring. v0 here just walks the directory tree.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tag", help="filter by category tag")
    parser.add_argument("--scenarios-dir", default="evals/scenarios")
    args = parser.parse_args()

    root = Path(args.scenarios_dir)
    if not root.is_dir():
        print(f"no scenarios dir at {root}", file=sys.stderr)
        return 0  # not a failure during scaffold phase

    scenarios = sorted(p for p in root.iterdir() if p.is_dir())
    if not scenarios:
        print("no scenarios yet — first batch lands Day 4 per LIN-4 plan")
        return 0

    counts: Counter[str] = Counter()
    for scenario in scenarios:
        gt_path = scenario / "ground_truth.json"
        if not gt_path.is_file():
            counts["missing_ground_truth"] += 1
            continue
        gt = json.loads(gt_path.read_text(encoding="utf-8"))
        if args.tag and gt.get("category") != args.tag:
            continue
        # TODO Day 4: wire fixtures into MCP fakes, call triagepack.reasoning.triage(alert),
        # score against ground_truth, increment pass/fail counters.
        counts["scaffold_skip"] += 1

    for k, v in counts.items():
        print(f"{k:24} {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
