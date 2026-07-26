"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MetricSource, TestType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refreshStubMetricsForProject } from "@/lib/integrations/sync";
import { recomputeVendorQuarterScore } from "@/lib/scoring/rollups";

async function requireQm() {
  const session = await auth();
  if (!session?.user || session.user.role !== "QUALITY_MANAGER") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

const vendorSchema = z.object({
  name: z.string().min(2).max(120),
});

const projectSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().min(2).max(120),
  externalId: z.string().min(2).max(120),
  requiredTestTypes: z.array(z.nativeEnum(TestType)).min(1),
});

const metricSchema = z.object({
  projectId: z.string().min(1),
  quarter: z.string().regex(/^\d{4}-Q[1-4]$/),
  automationCoverage: z.coerce.number().min(0).max(100),
  manualTests: z.coerce.number().int().min(0),
  automatedTests: z.coerce.number().int().min(0),
  prodDefectsLeaked: z.coerce.number().int().min(0),
  responsiveness: z.coerce.number().int().min(1).max(5),
  availability: z.coerce.number().int().min(1).max(5),
  complexityUnderstanding: z.coerce.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
});

export async function createVendorAction(formData: FormData): Promise<void> {
  await requireQm();
  const parsed = vendorSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return;

  await prisma.vendor.create({ data: { name: parsed.data.name } });
  revalidatePath("/qm");
}

export async function createProjectAction(formData: FormData): Promise<void> {
  await requireQm();
  const types = formData.getAll("requiredTestTypes").map(String) as TestType[];
  const parsed = projectSchema.safeParse({
    vendorId: formData.get("vendorId"),
    name: formData.get("name"),
    externalId: formData.get("externalId"),
    requiredTestTypes: types,
  });
  if (!parsed.success) return;

  await prisma.project.create({ data: parsed.data });
  revalidatePath("/qm");
  revalidatePath("/qm/projects");
}

export async function saveQuarterlyRatingAction(formData: FormData): Promise<void> {
  const user = await requireQm();
  const parsed = metricSchema.safeParse({
    projectId: formData.get("projectId"),
    quarter: formData.get("quarter"),
    automationCoverage: formData.get("automationCoverage"),
    manualTests: formData.get("manualTests"),
    automatedTests: formData.get("automatedTests"),
    prodDefectsLeaked: formData.get("prodDefectsLeaked"),
    responsiveness: formData.get("responsiveness"),
    availability: formData.get("availability"),
    complexityUnderstanding: formData.get("complexityUnderstanding"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return;

  const data = parsed.data;
  const project = await prisma.project.findUniqueOrThrow({ where: { id: data.projectId } });

  await prisma.$transaction([
    prisma.projectQuarterMetric.upsert({
      where: { projectId_quarter: { projectId: data.projectId, quarter: data.quarter } },
      create: {
        projectId: data.projectId,
        quarter: data.quarter,
        automationCoverage: data.automationCoverage,
        manualTests: data.manualTests,
        automatedTests: data.automatedTests,
        prodDefectsLeaked: data.prodDefectsLeaked,
        source: MetricSource.MANUAL,
      },
      update: {
        automationCoverage: data.automationCoverage,
        manualTests: data.manualTests,
        automatedTests: data.automatedTests,
        prodDefectsLeaked: data.prodDefectsLeaked,
        source: MetricSource.MANUAL,
      },
    }),
    prisma.qualitativeRating.upsert({
      where: { projectId_quarter: { projectId: data.projectId, quarter: data.quarter } },
      create: {
        projectId: data.projectId,
        quarter: data.quarter,
        responsiveness: data.responsiveness,
        availability: data.availability,
        complexityUnderstanding: data.complexityUnderstanding,
        notes: data.notes,
        ratedById: user.id,
      },
      update: {
        responsiveness: data.responsiveness,
        availability: data.availability,
        complexityUnderstanding: data.complexityUnderstanding,
        notes: data.notes,
        ratedById: user.id,
      },
    }),
  ]);

  await recomputeVendorQuarterScore(project.vendorId, data.quarter);
  revalidatePath("/qm");
  revalidatePath("/qm/ratings");
  revalidatePath("/leadership");
}

export async function refreshStubDataAction(formData: FormData): Promise<void> {
  await requireQm();
  const projectId = String(formData.get("projectId") ?? "");
  const quarter = String(formData.get("quarter") ?? "");
  if (!projectId || !/^\d{4}-Q[1-4]$/.test(quarter)) return;

  await refreshStubMetricsForProject(projectId, quarter);
  revalidatePath("/qm/ratings");
  revalidatePath("/leadership");
}
