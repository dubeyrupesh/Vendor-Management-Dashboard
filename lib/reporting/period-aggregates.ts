import { prisma } from "@/lib/db";
import { averageNumbers, type PeriodSelection, resolvePeriod } from "@/lib/periods";
import { AUTOMATION_COVERAGE_TARGET } from "@/lib/scoring/weights";

export type BreakdownProject = {
  projectId: string;
  projectName: string;
  overallScore: number;
  automationCoverageScore: number;
  xrayAutomationRatioScore: number;
  qualitativeScore: number;
  prodDefectLeakageScore: number;
  meetsCoverageTarget: boolean;
};

export type VendorPeriodRow = {
  vendorId: string;
  vendorName: string;
  overallScore: number;
  projectCount: number;
  ratedCount: number;
  avgCoverage: number;
  pctMeetingTarget: number;
  factorAverages: {
    coverage: number;
    xray: number;
    qualitative: number;
    defects: number;
  };
  projects: Array<{
    projectId: string;
    name: string;
    coverage: number;
    xrayRatio: number;
    responsiveness: number;
    availability: number;
    complexityUnderstanding: number;
    defects: number;
    score: number;
    meetsCoverageTarget: boolean;
    hasMetric: boolean;
    hasRating: boolean;
  }>;
  scoreBreakdownProjects: BreakdownProject[];
};

/** Minimal vendor shape needed to aggregate a period view (Prisma include result). */
export type VendorPeriodSource = {
  id: string;
  name: string;
  scores: Array<{
    quarter: string;
    overallScore: number;
    scoreBreakdown: unknown;
  }>;
  projects: Array<{
    id: string;
    name: string;
    metrics: Array<{
      automationCoverage: number;
      manualTests: number;
      automatedTests: number;
      prodDefectsLeaked: number;
    }>;
    ratings: Array<{
      responsiveness: number;
      availability: number;
      complexityUnderstanding: number;
    }>;
  }>;
};

function clampQualitative(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export async function listAvailableQuarters() {
  const rows = await prisma.vendorQuarterScore.findMany({
    select: { quarter: true },
    distinct: ["quarter"],
    orderBy: { quarter: "asc" },
  });
  return rows.map((row) => row.quarter);
}

/**
 * Pure aggregator used by getVendorPeriodRows — unit-tested without Prisma.
 * Only vendors with at least one VendorQuarterScore in `quarters` are included.
 */
export function buildVendorPeriodRows(
  vendors: VendorPeriodSource[],
  quarters: string[],
): VendorPeriodRow[] {
  if (quarters.length === 0) return [];

  return vendors
    .map((vendor) => {
      const periodScores = vendor.scores.filter((score) => quarters.includes(score.quarter));
      if (periodScores.length === 0) return null;

      const overallScore = averageNumbers(periodScores.map((score) => score.overallScore));

      const breakdownByProject = new Map<string, BreakdownProject[]>();
      for (const score of periodScores) {
        const projects =
          (score.scoreBreakdown as { projects?: BreakdownProject[] } | null)?.projects ?? [];
        for (const project of projects) {
          const list = breakdownByProject.get(project.projectId) ?? [];
          list.push(project);
          breakdownByProject.set(project.projectId, list);
        }
      }

      const scoreBreakdownProjects: BreakdownProject[] = [...breakdownByProject.entries()].map(
        ([projectId, list]) => {
          const first = list[0];
          const automationCoverageScore = averageNumbers(
            list.map((item) => item.automationCoverageScore),
          );
          return {
            projectId,
            projectName: first.projectName,
            overallScore: averageNumbers(list.map((item) => item.overallScore)),
            automationCoverageScore,
            xrayAutomationRatioScore: averageNumbers(
              list.map((item) => item.xrayAutomationRatioScore),
            ),
            qualitativeScore: averageNumbers(list.map((item) => item.qualitativeScore)),
            prodDefectLeakageScore: averageNumbers(
              list.map((item) => item.prodDefectLeakageScore),
            ),
            meetsCoverageTarget: automationCoverageScore > AUTOMATION_COVERAGE_TARGET,
          };
        },
      );

      const projects = vendor.projects.map((project) => {
        const coverages = project.metrics.map((metric) => metric.automationCoverage);
        const defects = project.metrics.map((metric) => metric.prodDefectsLeaked);
        const xrayRatios = project.metrics.map((metric) => {
          const total = metric.manualTests + metric.automatedTests;
          return total ? (metric.automatedTests / total) * 100 : 0;
        });
        const responsiveness = project.ratings.map((rating) => rating.responsiveness);
        const availability = project.ratings.map((rating) => rating.availability);
        const complexity = project.ratings.map((rating) => rating.complexityUnderstanding);
        const projectScore = scoreBreakdownProjects.find((item) => item.projectId === project.id);
        const coverage = averageNumbers(coverages);

        return {
          projectId: project.id,
          name: project.name,
          coverage,
          xrayRatio: averageNumbers(xrayRatios),
          responsiveness: responsiveness.length
            ? clampQualitative(averageNumbers(responsiveness))
            : 0,
          availability: availability.length ? clampQualitative(averageNumbers(availability)) : 0,
          complexityUnderstanding: complexity.length
            ? clampQualitative(averageNumbers(complexity))
            : 0,
          defects: averageNumbers(defects),
          score: projectScore?.overallScore ?? 0,
          meetsCoverageTarget: coverage > AUTOMATION_COVERAGE_TARGET,
          hasMetric: project.metrics.length > 0,
          hasRating: project.ratings.length > 0,
        };
      });

      const ratedCount = projects.filter((project) => project.hasMetric && project.hasRating).length;
      const avgCoverage = averageNumbers(projects.map((project) => project.coverage));
      const meeting = projects.filter((project) => project.meetsCoverageTarget).length;

      const factorAverages = {
        coverage: averageNumbers(scoreBreakdownProjects.map((p) => p.automationCoverageScore)),
        xray: averageNumbers(scoreBreakdownProjects.map((p) => p.xrayAutomationRatioScore)),
        qualitative: averageNumbers(scoreBreakdownProjects.map((p) => p.qualitativeScore)),
        defects: averageNumbers(scoreBreakdownProjects.map((p) => p.prodDefectLeakageScore)),
      };

      return {
        vendorId: vendor.id,
        vendorName: vendor.name,
        overallScore,
        projectCount: projects.length,
        ratedCount,
        avgCoverage,
        pctMeetingTarget: projects.length
          ? Number(((meeting / projects.length) * 100).toFixed(1))
          : 0,
        factorAverages,
        projects,
        scoreBreakdownProjects,
      };
    })
    .filter((row): row is VendorPeriodRow => row !== null)
    .sort((a, b) => b.overallScore - a.overallScore);
}

export async function getVendorPeriodRows(selection: PeriodSelection): Promise<{
  label: string;
  quarters: string[];
  rows: VendorPeriodRow[];
}> {
  const { label, quarters } = resolvePeriod(selection);
  if (quarters.length === 0) {
    return { label, quarters, rows: [] };
  }

  const vendors = await prisma.vendor.findMany({
    where: { active: true },
    include: {
      scores: { where: { quarter: { in: quarters } } },
      projects: {
        where: { active: true },
        include: {
          metrics: { where: { quarter: { in: quarters } } },
          ratings: { where: { quarter: { in: quarters } } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return {
    label,
    quarters,
    rows: buildVendorPeriodRows(vendors, quarters),
  };
}
