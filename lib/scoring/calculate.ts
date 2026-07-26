import {
  AUTOMATION_COVERAGE_TARGET,
  MAX_DEFECTS_FOR_SCORE,
  SCORING_WEIGHTS,
} from "./weights";

export type ProjectScoreInput = {
  automationCoverage: number;
  manualTests: number;
  automatedTests: number;
  responsiveness: number;
  availability: number;
  complexityUnderstanding: number;
  prodDefectsLeaked: number;
};

export type ProjectScoreBreakdown = {
  automationCoverageScore: number;
  xrayAutomationRatioScore: number;
  qualitativeScore: number;
  prodDefectLeakageScore: number;
  meetsCoverageTarget: boolean;
  overallScore: number;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function scoreAutomationCoverage(coveragePercent: number): number {
  return clamp(coveragePercent);
}

export function scoreXrayAutomationRatio(manualTests: number, automatedTests: number): number {
  const total = manualTests + automatedTests;
  if (total <= 0) return 0;
  return clamp((automatedTests / total) * 100);
}

export function scoreQualitative(
  responsiveness: number,
  availability: number,
  complexityUnderstanding: number,
): number {
  const avg = (responsiveness + availability + complexityUnderstanding) / 3;
  return clamp((avg / 5) * 100);
}

export function scoreProdDefectLeakage(defects: number): number {
  if (defects <= 0) return 100;
  if (defects >= MAX_DEFECTS_FOR_SCORE) return 0;
  return clamp(100 * (1 - defects / MAX_DEFECTS_FOR_SCORE));
}

export function calculateProjectScore(input: ProjectScoreInput): ProjectScoreBreakdown {
  const automationCoverageScore = scoreAutomationCoverage(input.automationCoverage);
  const xrayAutomationRatioScore = scoreXrayAutomationRatio(
    input.manualTests,
    input.automatedTests,
  );
  const qualitativeScore = scoreQualitative(
    input.responsiveness,
    input.availability,
    input.complexityUnderstanding,
  );
  const prodDefectLeakageScore = scoreProdDefectLeakage(input.prodDefectsLeaked);

  const overallScore =
    automationCoverageScore * SCORING_WEIGHTS.automationCoverage +
    xrayAutomationRatioScore * SCORING_WEIGHTS.xrayAutomationRatio +
    qualitativeScore * SCORING_WEIGHTS.qualitative +
    prodDefectLeakageScore * SCORING_WEIGHTS.prodDefectLeakage;

  return {
    automationCoverageScore,
    xrayAutomationRatioScore,
    qualitativeScore,
    prodDefectLeakageScore,
    meetsCoverageTarget: input.automationCoverage > AUTOMATION_COVERAGE_TARGET,
    overallScore: Number(overallScore.toFixed(2)),
  };
}

export function averageVendorScore(projectScores: number[]): number {
  if (projectScores.length === 0) return 0;
  const sum = projectScores.reduce((acc, score) => acc + score, 0);
  return Number((sum / projectScores.length).toFixed(2));
}
