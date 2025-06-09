"""Eval harness.

Each scenario directory contains:

    alert.json         — PagerDuty webhook payload (parsed by from_pagerduty)
    fixtures/
        commits.json   — list of {sha, author, committed_at, message, url}
        logs.json      — list of {ts, level, message, ...}
        runbook.md     — runbook markdown
    ground_truth.json  — {category, root_component, cause_family, fix_keywords[]}

The harness wires the fixtures into the MCP modules so the same triage() code
path runs as in production, then scores the result against ground_truth.

Pass = (root_component matches OR cause_family matches) AND
       at least one fix_keyword appears in result.suggested_fix or result.rca.
Confidence calibration is reported separately.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

from triagepack.alert import from_pagerduty
from triagepack.mcp import github, logs, runbook
from triagepack.reasoning import TriageResult, triage


class _FakeLogsBackend:
    def __init__(self, lines: list[dict[str, Any]]) -> None:
        self.lines = lines

    async def fetch(self, service: str, around: datetime, window_minutes: int) -> list[dict[str, Any]]:
        return self.lines


def _install_fixtures(scenario: Path) -> None:
    fixtures = scenario / "fixtures"

    commits_path = fixtures / "commits.json"
    commits = json.loads(commits_path.read_text(encoding="utf-8")) if commits_path.is_file() else []

    async def fake_recent_commits(repo: str, since: datetime | None = None, limit: int = 20) -> list[dict[str, Any]]:
        return commits[:limit]

    github.recent_commits = fake_recent_commits  # type: ignore[assignment]

    logs_path = fixtures / "logs.json"
    log_lines = json.loads(logs_path.read_text(encoding="utf-8")) if logs_path.is_file() else []
    logs.use_backend(_FakeLogsBackend(log_lines))

    runbook_path = fixtures / "runbook.md"
    runbook.use_value(runbook_path.read_text(encoding="utf-8") if runbook_path.is_file() else None)


def _score(result: TriageResult, gt: dict[str, Any]) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    haystack = (result.rca + " " + (result.suggested_fix or "")).lower()

    rc = (gt.get("root_component") or "").lower()
    cf = (gt.get("cause_family") or "").lower()
    fix_keywords = [k.lower() for k in gt.get("fix_keywords", [])]

    component_match = bool(rc) and rc in haystack
    cause_match = bool(cf) and cf in haystack
    if not (component_match or cause_match):
        reasons.append("no root_component / cause_family match")

    fix_match = any(k in haystack for k in fix_keywords) if fix_keywords else True
    if not fix_match:
        reasons.append(f"no fix keyword from {fix_keywords}")

    return ((component_match or cause_match) and fix_match), reasons


async def _run_scenario(scenario: Path) -> dict[str, Any]:
    _install_fixtures(scenario)
    payload = json.loads((scenario / "alert.json").read_text(encoding="utf-8"))
    alert = from_pagerduty(payload)
    # Force the GitHub fetch to fire by pointing at a placeholder repo. The fake recent_commits
    # ignores the repo arg and returns the canned fixture, so the placeholder never escapes.
    alert.repo = "evals/fake"
    gt = json.loads((scenario / "ground_truth.json").read_text(encoding="utf-8"))

    try:
        result = await triage(alert)
    except Exception as exc:  # noqa: BLE001
        return {
            "id": scenario.name,
            "passed": False,
            "reasons": [f"triage raised: {exc}"],
            "category": gt.get("category"),
            "confidence": 0.0,
            "needs_human": True,
        }

    passed, reasons = _score(result, gt)
    return {
        "id": scenario.name,
        "passed": passed,
        "reasons": reasons,
        "category": gt.get("category"),
        "confidence": result.confidence,
        "needs_human": result.needs_human,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tag", help="filter by category")
    parser.add_argument("--scenarios-dir", default="evals/scenarios")
    parser.add_argument(
        "--write-baseline",
        action="store_true",
        help="Persist results to evals/baseline.json (consumed by the landing page).",
    )
    args = parser.parse_args()

    root = Path(args.scenarios_dir)
    if not root.is_dir():
        print(f"no scenarios dir at {root}", file=sys.stderr)
        return 0

    scenarios = sorted(p for p in root.iterdir() if p.is_dir() and (p / "ground_truth.json").is_file())
    if not scenarios:
        print("no scenarios with ground_truth.json yet")
        return 0

    if args.tag:
        scenarios = [
            s
            for s in scenarios
            if json.loads((s / "ground_truth.json").read_text(encoding="utf-8")).get("category") == args.tag
        ]

    results = asyncio.run(_run_all(scenarios))

    pass_n = sum(1 for r in results if r["passed"])
    by_cat: Counter[str] = Counter()
    pass_by_cat: Counter[str] = Counter()
    for r in results:
        cat = r.get("category") or "uncategorised"
        by_cat[cat] += 1
        if r["passed"]:
            pass_by_cat[cat] += 1

    high_conf_correct = sum(1 for r in results if r["confidence"] >= 0.6 and r["passed"])
    high_conf = sum(1 for r in results if r["confidence"] >= 0.6)
    calibration = (high_conf_correct / high_conf) if high_conf else 0.0

    print(f"\nresults: {pass_n}/{len(results)} pass ({pass_n / len(results):.0%})")
    print(f"calibration: {high_conf_correct}/{high_conf} of high-confidence results were correct ({calibration:.0%})")
    print("\nby category:")
    for cat, total in by_cat.most_common():
        passed = pass_by_cat[cat]
        print(f"  {cat:14} {passed}/{total}")
    print("\nfailures:")
    for r in results:
        if not r["passed"]:
            print(f"  {r['id']:38} {' / '.join(r['reasons'])}")

    if args.write_baseline:
        baseline_path = Path(args.scenarios_dir).parent / "baseline.json"
        existing = json.loads(baseline_path.read_text(encoding="utf-8")) if baseline_path.is_file() else {}
        existing.update({
            "version": existing.get("version", "0.1.0-dev"),
            "measured": True,
            "measuredAt": datetime.utcnow().isoformat() + "Z",
            "totalScenarios": len(results),
            "passed": pass_n,
            "passRate": round(pass_n / len(results), 3) if results else 0.0,
            "byCategory": {
                cat: {"total": by_cat[cat], "passed": pass_by_cat[cat]}
                for cat in by_cat
            },
            "calibration": {
                "highConfidenceCorrect": high_conf_correct,
                "highConfidenceTotal": high_conf,
                "rate": round(calibration, 3),
            },
        })
        baseline_path.write_text(json.dumps(existing, indent=2) + "\n", encoding="utf-8")
        print(f"\nwrote baseline -> {baseline_path}")

    return 0 if pass_n == len(results) else 1


async def _run_all(scenarios: list[Path]) -> list[dict[str, Any]]:
    out = []
    for s in scenarios:
        out.append(await _run_scenario(s))
        github.recent_commits = github.recent_commits  # noqa: PLW0127  # keep ref alive between scenarios
    logs.use_backend(None)
    runbook.clear_override()
    return out


if __name__ == "__main__":
    sys.exit(main())
