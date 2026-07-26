-- CreateEnum
CREATE TYPE "Role" AS ENUM ('QUALITY_MANAGER', 'LEADERSHIP');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('WEB', 'MOBILE', 'API', 'PERFORMANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "MetricSource" AS ENUM ('MANUAL', 'STUB', 'GITLAB', 'XRAY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "requiredTestTypes" "TestType"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectQuarterMetric" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "automationCoverage" DOUBLE PRECISION NOT NULL,
    "manualTests" INTEGER NOT NULL DEFAULT 0,
    "automatedTests" INTEGER NOT NULL DEFAULT 0,
    "prodDefectsLeaked" INTEGER NOT NULL DEFAULT 0,
    "source" "MetricSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectQuarterMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualitativeRating" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "responsiveness" INTEGER NOT NULL,
    "availability" INTEGER NOT NULL,
    "complexityUnderstanding" INTEGER NOT NULL,
    "ratedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualitativeRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorQuarterScore" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorQuarterScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Project_externalId_key" ON "Project"("externalId");

-- CreateIndex
CREATE INDEX "Project_vendorId_idx" ON "Project"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_vendorId_name_key" ON "Project"("vendorId", "name");

-- CreateIndex
CREATE INDEX "ProjectQuarterMetric_quarter_idx" ON "ProjectQuarterMetric"("quarter");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectQuarterMetric_projectId_quarter_key" ON "ProjectQuarterMetric"("projectId", "quarter");

-- CreateIndex
CREATE INDEX "QualitativeRating_quarter_idx" ON "QualitativeRating"("quarter");

-- CreateIndex
CREATE UNIQUE INDEX "QualitativeRating_projectId_quarter_key" ON "QualitativeRating"("projectId", "quarter");

-- CreateIndex
CREATE INDEX "VendorQuarterScore_quarter_idx" ON "VendorQuarterScore"("quarter");

-- CreateIndex
CREATE UNIQUE INDEX "VendorQuarterScore_vendorId_quarter_key" ON "VendorQuarterScore"("vendorId", "quarter");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectQuarterMetric" ADD CONSTRAINT "ProjectQuarterMetric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualitativeRating" ADD CONSTRAINT "QualitativeRating_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualitativeRating" ADD CONSTRAINT "QualitativeRating_ratedById_fkey" FOREIGN KEY ("ratedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuarterScore" ADD CONSTRAINT "VendorQuarterScore_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
