import { MetricSource, PrismaClient, Role, TestType } from "@prisma/client";
import { hash } from "bcryptjs";
import { calculateProjectScore, averageVendorScore } from "../lib/scoring/calculate";
import { StubGitLabSource } from "../lib/integrations/gitlab/stub";
import { StubJiraXraySource } from "../lib/integrations/jira-xray/stub";

const prisma = new PrismaClient();
const gitlab = new StubGitLabSource();
const xray = new StubJiraXraySource();

const QUARTER = "2026-Q2";

async function main() {
  await prisma.vendorQuarterScore.deleteMany();
  await prisma.qualitativeRating.deleteMany();
  await prisma.projectQuarterMetric.deleteMany();
  await prisma.project.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("password123", 10);

  await prisma.user.createMany({
    data: [
      {
        email: "qm@example.com",
        name: "Quality Manager",
        passwordHash,
        role: Role.QUALITY_MANAGER,
      },
      {
        email: "lead@example.com",
        name: "Leadership Viewer",
        passwordHash,
        role: Role.LEADERSHIP,
      },
    ],
  });

  const qm = await prisma.user.findUniqueOrThrow({ where: { email: "qm@example.com" } });

  const vendors = [
    {
      name: "Apex Testing Partners",
      projects: [
        { name: "Checkout Web", externalId: "apex-checkout", types: [TestType.WEB, TestType.API] },
        { name: "Mobile Banking", externalId: "apex-mobile", types: [TestType.MOBILE, TestType.API] },
      ],
    },
    {
      name: "Nimbus QA Collective",
      projects: [
        { name: "Claims API", externalId: "nimbus-claims", types: [TestType.API, TestType.PERFORMANCE] },
        { name: "Agent Portal", externalId: "nimbus-portal", types: [TestType.WEB] },
      ],
    },
    {
      name: "Harbor Automation Labs",
      projects: [
        { name: "Logistics Suite", externalId: "harbor-logistics", types: [TestType.WEB, TestType.MOBILE, TestType.API] },
      ],
    },
  ];

  const qualitativeSeed: Record<string, { responsiveness: number; availability: number; complexityUnderstanding: number }> = {
    "apex-checkout": { responsiveness: 5, availability: 4, complexityUnderstanding: 5 },
    "apex-mobile": { responsiveness: 4, availability: 4, complexityUnderstanding: 4 },
    "nimbus-claims": { responsiveness: 3, availability: 4, complexityUnderstanding: 3 },
    "nimbus-portal": { responsiveness: 4, availability: 3, complexityUnderstanding: 4 },
    "harbor-logistics": { responsiveness: 5, availability: 5, complexityUnderstanding: 4 },
  };

  for (const vendorData of vendors) {
    const vendor = await prisma.vendor.create({ data: { name: vendorData.name } });
    const projectScores: number[] = [];
    const projectBreakdowns = [];

    for (const projectData of vendorData.projects) {
      const project = await prisma.project.create({
        data: {
          vendorId: vendor.id,
          name: projectData.name,
          externalId: projectData.externalId,
          requiredTestTypes: projectData.types,
        },
      });

      const coverage = (await gitlab.getAutomationCoverage(project.externalId, QUARTER)) ?? 0;
      const defects = await gitlab.getProdDefectCount(project.externalId, QUARTER);
      const counts = await xray.getXrayTestCounts(project.externalId, QUARTER);
      const qualitative = qualitativeSeed[project.externalId];

      await prisma.projectQuarterMetric.create({
        data: {
          projectId: project.id,
          quarter: QUARTER,
          automationCoverage: coverage,
          manualTests: counts.manual,
          automatedTests: counts.automated,
          prodDefectsLeaked: defects,
          source: MetricSource.STUB,
        },
      });

      await prisma.qualitativeRating.create({
        data: {
          projectId: project.id,
          quarter: QUARTER,
          ...qualitative,
          ratedById: qm.id,
        },
      });

      const breakdown = calculateProjectScore({
        automationCoverage: coverage,
        manualTests: counts.manual,
        automatedTests: counts.automated,
        ...qualitative,
        prodDefectsLeaked: defects,
      });

      projectScores.push(breakdown.overallScore);
      projectBreakdowns.push({
        projectId: project.id,
        projectName: project.name,
        ...breakdown,
      });
    }

    await prisma.vendorQuarterScore.create({
      data: {
        vendorId: vendor.id,
        quarter: QUARTER,
        overallScore: averageVendorScore(projectScores),
        scoreBreakdown: { projects: projectBreakdowns },
      },
    });
  }

  console.log("Seed complete.");
  console.log("Users: qm@example.com / lead@example.com — password: password123");
  console.log(`Quarter seeded: ${QUARTER}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
