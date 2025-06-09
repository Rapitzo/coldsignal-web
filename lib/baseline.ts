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

export function passRateLine(): string {
  if (!BASELINE.measured || BASELINE.passRate == null || BASELINE.passed == null) {
    return `${BASELINE.totalScenarios} scenarios in the eval suite. Pass-rate published when measured.`;
  }
  const pct = Math.round(BASELINE.passRate * 100);
  return `${BASELINE.passed}/${BASELINE.totalScenarios} pass (${pct}%) on the v${process.env.npm_package_version ?? "0.1.0"} baseline. Re-run on your own infra.`;
}
