import { MetricSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import { StubGitLabSource } from "./gitlab/stub";
import { StubJiraXraySource } from "./jira-xray/stub";
import { recomputeVendorQuarterScore } from "@/lib/scoring/rollups";

const gitlab = new StubGitLabSource();
const xray = new StubJiraXraySource();

export async function refreshStubMetricsForProject(projectId: string, quarter: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  const coverage = await gitlab.getAutomationCoverage(project.externalId, quarter);
  const defects = await gitlab.getProdDefectCount(project.externalId, quarter);
  const counts = await xray.getXrayTestCounts(project.externalId, quarter);

  const metric = await prisma.projectQuarterMetric.upsert({
    where: { projectId_quarter: { projectId, quarter } },
    create: {
      projectId,
      quarter,
      automationCoverage: coverage ?? 0,
      manualTests: counts.manual,
      automatedTests: counts.automated,
      prodDefectsLeaked: defects,
      source: MetricSource.STUB,
    },
    update: {
      automationCoverage: coverage ?? 0,
      manualTests: counts.manual,
      automatedTests: counts.automated,
      prodDefectsLeaked: defects,
      source: MetricSource.STUB,
    },
  });

  await recomputeVendorQuarterScore(project.vendorId, quarter);
  return metric;
}
