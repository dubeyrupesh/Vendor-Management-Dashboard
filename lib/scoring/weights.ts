export const SCORING_WEIGHTS = {
  automationCoverage: 0.35,
  xrayAutomationRatio: 0.2,
  qualitative: 0.3,
  prodDefectLeakage: 0.15,
} as const;

export const AUTOMATION_COVERAGE_TARGET = 80;

/** Defects at or above this count yield 0 points for the leakage factor. */
export const MAX_DEFECTS_FOR_SCORE = 10;
