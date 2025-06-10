// Reads the eval baseline from agent/evals/baseline.json. Until the eval harness
// writes a measured value (`evals/run.py --write-baseline`), the page renders
// "Pass-rate published when measured." rather than a fake number.

import baseline from "../agent/evals/baseline.json";

export type Baseline = {
  measured: boolean;
  measuredAt: string | null;
  totalScenarios: number;
  passed: number | null;
  passRate: number | null;
  byCategory: Record<string, { total: number; passed: number | null }>;
};

export const BASELINE = baseline as Baseline;

// Public commitment: if the baseline is unmeasured at v0.1.0 ship, the measured
// number publishes as a v0.1.1 release asset by 2026-05-12 (1 week post-ship).
// This date is a public promise; do not move it without CEO sign-off.
export const PASS_RATE_COMMITMENT_DATE = "2026-05-12";

export function passRateLine(): string {
  if (!BASELINE.measured || BASELINE.passRate == null || BASELINE.passed == null) {
    return `${BASELINE.totalScenarios} scenarios in the eval suite. Measured pass-rate publishes as v0.1.1 release asset (baseline.json) by ${PASS_RATE_COMMITMENT_DATE}.`;
  }
  const pct = Math.round(BASELINE.passRate * 100);
  return `${BASELINE.passed}/${BASELINE.totalScenarios} pass (${pct}%) on the v${process.env.npm_package_version ?? "0.1.0"} baseline. Re-run on your own infra.`;
}
