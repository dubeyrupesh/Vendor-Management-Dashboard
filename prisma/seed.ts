import { MetricSource, PrismaClient, Role, TestType } from "@prisma/client";
import { hash } from "bcryptjs";
import { averageVendorScore, calculateProjectScore } from "../lib/scoring/calculate";
import { StubGitLabSource } from "../lib/integrations/gitlab/stub";
import { StubJiraXraySource } from "../lib/integrations/jira-xray/stub";

const prisma = new PrismaClient();
const gitlab = new StubGitLabSource();
const xray = new StubJiraXraySource();

const QUARTER = "2026-Q2";

type ProjectSeed = {
  name: string;
  externalId: string;
  types: TestType[];
  qualitative: {
    responsiveness: number;
    availability: number;
    complexityUnderstanding: number;
  };
};

const vendors: { name: string; projects: ProjectSeed[] }[] = [
  {
    name: "Apex Testing Partners",
    projects: [
      {
        name: "Checkout Web",
        externalId: "apex-checkout",
        types: [TestType.WEB, TestType.API],
        qualitative: { responsiveness: 5, availability: 4, complexityUnderstanding: 5 },
      },
      {
        name: "Mobile Banking",
        externalId: "apex-mobile",
        types: [TestType.MOBILE, TestType.API],
        qualitative: { responsiveness: 4, availability: 4, complexityUnderstanding: 4 },
      },
      {
        name: "Payments API",
        externalId: "apex-payments",
        types: [TestType.API, TestType.PERFORMANCE],
        qualitative: { responsiveness: 5, availability: 5, complexityUnderstanding: 4 },
      },
      {
        name: "Fraud Console",
        externalId: "apex-fraud",
        types: [TestType.WEB],
        qualitative: { responsiveness: 4, availability: 3, complexityUnderstanding: 5 },
      },
      {
        name: "Onboarding Journey",
        externalId: "apex-onboarding",
        types: [TestType.WEB, TestType.MOBILE],
        qualitative: { responsiveness: 4, availability: 4, complexityUnderstanding: 3 },
      },
    ],
  },
  {
    name: "Nimbus QA Collective",
    projects: [
      {
        name: "Claims API",
        externalId: "nimbus-claims",
        types: [TestType.API, TestType.PERFORMANCE],
        qualitative: { responsiveness: 3, availability: 4, complexityUnderstanding: 3 },
      },
      {
        name: "Agent Portal",
        externalId: "nimbus-portal",
        types: [TestType.WEB],
        qualitative: { responsiveness: 4, availability: 3, complexityUnderstanding: 4 },
      },
      {
        name: "Policy Mobile",
        externalId: "nimbus-policy-mobile",
        types: [TestType.MOBILE, TestType.API],
        qualitative: { responsiveness: 3, availability: 3, complexityUnderstanding: 4 },
      },
      {
        name: "Underwriting Engine",
        externalId: "nimbus-underwriting",
        types: [TestType.API, TestType.OTHER],
        qualitative: { responsiveness: 4, availability: 4, complexityUnderstanding: 5 },
      },
      {
        name: "Customer Notify",
        externalId: "nimbus-notify",
        types: [TestType.API, TestType.PERFORMANCE],
        qualitative: { responsiveness: 3, availability: 4, complexityUnderstanding: 3 },
      },
    ],
  },
  {
    name: "Harbor Automation Labs",
    projects: [
      {
        name: "Logistics Suite",
        externalId: "harbor-logistics",
        types: [TestType.WEB, TestType.MOBILE, TestType.API],
        qualitative: { responsiveness: 5, availability: 5, complexityUnderstanding: 4 },
      },
      {
        name: "Yard Ops Mobile",
        externalId: "harbor-yard",
        types: [TestType.MOBILE],
        qualitative: { responsiveness: 5, availability: 4, complexityUnderstanding: 4 },
      },
      {
        name: "Fleet Telemetry API",
        externalId: "harbor-telemetry",
        types: [TestType.API, TestType.PERFORMANCE],
        qualitative: { responsiveness: 4, availability: 5, complexityUnderstanding: 5 },
      },
      {
        name: "Customs Portal",
        externalId: "harbor-customs",
        types: [TestType.WEB, TestType.API],
        qualitative: { responsiveness: 4, availability: 4, complexityUnderstanding: 4 },
      },
      {
        name: "Warehouse WMS",
        externalId: "harbor-wms",
        types: [TestType.WEB, TestType.OTHER],
        qualitative: { responsiveness: 5, availability: 5, complexityUnderstanding: 5 },
      },
    ],
  },
];

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
      const qualitative = projectData.qualitative;

      // Every project gets metrics + qualitative ratings for the quarter.
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

    // Vendor score = average of all project scores for the quarter.
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
  console.log(`Vendors: ${vendors.length}; projects per vendor: 5; total projects: ${vendors.length * 5}`);
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
