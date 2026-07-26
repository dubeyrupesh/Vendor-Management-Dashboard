import { prisma } from "@/lib/db";
import { averageVendorScore, calculateProjectScore } from "./calculate";

export async function recomputeVendorQuarterScore(vendorId: string, quarter: string) {
  const projects = await prisma.project.findMany({
    where: { vendorId, active: true },
    include: {
      metrics: { where: { quarter } },
      ratings: { where: { quarter } },
    },
  });

  const projectBreakdowns = projects.map((project) => {
    const metric = project.metrics[0];
    const rating = project.ratings[0];
    if (!metric || !rating) {
      return null;
    }

    const breakdown = calculateProjectScore({
      automationCoverage: metric.automationCoverage,
      manualTests: metric.manualTests,
      automatedTests: metric.automatedTests,
      responsiveness: rating.responsiveness,
      availability: rating.availability,
      complexityUnderstanding: rating.complexityUnderstanding,
      prodDefectsLeaked: metric.prodDefectsLeaked,
    });

    return {
      projectId: project.id,
      projectName: project.name,
      ...breakdown,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const overallScore = averageVendorScore(projectBreakdowns.map((p) => p.overallScore));

  return prisma.vendorQuarterScore.upsert({
    where: { vendorId_quarter: { vendorId, quarter } },
    create: {
      vendorId,
      quarter,
      overallScore,
      scoreBreakdown: { projects: projectBreakdowns },
    },
    update: {
      overallScore,
      scoreBreakdown: { projects: projectBreakdowns },
    },
  });
}

export async function recomputeAllVendorScoresForQuarter(quarter: string) {
  const vendors = await prisma.vendor.findMany({ where: { active: true } });
  const results = [];
  for (const vendor of vendors) {
    results.push(await recomputeVendorQuarterScore(vendor.id, quarter));
  }
  return results;
}
