# Eval suite

30 anonymised PagerDuty incident scenarios, target by Day 8 of the cycle. v0 ships with the harness and a placeholder scenario set; cases land progressively per the LIN-4 plan.

## What's measured

For each scenario the harness reports:

- **Pass / fail** — RCA matches ground truth on at least one of (root component, root cause family, blast radius), AND the suggested fix is in the right ballpark.
- **Confidence calibration** — how often a high-confidence (>= 0.6) result was actually correct.
- **Per-category breakdown** — infra / app / data / auth / dependency.
- **MCP context completeness** — for each scenario, did the agent successfully fetch commits / logs / runbook.

## Scenario format

Each scenario is a directory under `scenarios/`:

```
scenarios/
  001-redis-eviction-storm/
    alert.json            # PagerDuty webhook payload
    fixtures/
      commits.json        # canned recent commits
      logs.json           # canned log snapshot
      runbook.md          # canned runbook
    ground_truth.json     # {"root_component": "...", "cause_family": "...", "fix_keywords": [...]}
```

The harness wires the canned fixtures into the MCP clients via fakes so the same code paths run as in production, but no network is required.

## Running

```bash
cd agent
uv run python -m evals.run               # all scenarios
uv run python -m evals.run --tag infra   # one category
```
