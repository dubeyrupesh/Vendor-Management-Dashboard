export const SCORING_WEIGHTS = {
  automationCoverage: 0.35,
  xrayAutomationRatio: 0.2,
  qualitative: 0.3,
  prodDefectLeakage: 0.15,
} as const;

export const AUTOMATION_COVERAGE_TARGET = 80;

/** Defects at or above this count yield 0 points for the leakage factor. */
export const MAX_DEFECTS_FOR_SCORE = 10;

export function weightedFactorContributions(factors: {
  automationCoverageScore: number;
  xrayAutomationRatioScore: number;
  qualitativeScore: number;
  prodDefectLeakageScore: number;
}) {
  return {
    coverage: Number((factors.automationCoverageScore * SCORING_WEIGHTS.automationCoverage).toFixed(2)),
    xray: Number((factors.xrayAutomationRatioScore * SCORING_WEIGHTS.xrayAutomationRatio).toFixed(2)),
    qualitative: Number((factors.qualitativeScore * SCORING_WEIGHTS.qualitative).toFixed(2)),
    defects: Number((factors.prodDefectLeakageScore * SCORING_WEIGHTS.prodDefectLeakage).toFixed(2)),
  };
}
