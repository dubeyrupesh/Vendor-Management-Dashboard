import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatScore } from "@/lib/utils";
import { AUTOMATION_COVERAGE_TARGET, weightedFactorContributions } from "@/lib/scoring/weights";
import { ProjectScoreBarChart } from "@/components/charts/ProjectScoreBarChart";
import { ProjectFactorStackedChart } from "@/components/charts/ProjectFactorStackedChart";
import { ProjectAttributeBarChart } from "@/components/charts/ProjectAttributeBarChart";

type BreakdownProject = {
  projectId: string;
  projectName: string;
  overallScore: number;
  automationCoverageScore: number;
  xrayAutomationRatioScore: number;
  qualitativeScore: number;
  prodDefectLeakageScore: number;
  meetsCoverageTarget: boolean;
};

export default async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ vendorId: string }>;
  searchParams: Promise<{ quarter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { vendorId } = await params;
  const { quarter = "2026-Q2" } = await searchParams;

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      scores: { where: { quarter } },
      projects: {
        where: { active: true },
        include: {
          metrics: { where: { quarter } },
          ratings: { where: { quarter } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!vendor) notFound();

  const score = vendor.scores[0];
  const breakdown = (score?.scoreBreakdown as { projects?: BreakdownProject[] } | null)?.projects ?? [];

  const projectRows = vendor.projects.map((project) => {
    const metric = project.metrics[0];
    const rating = project.ratings[0];
    const projectScore = breakdown.find((item) => item.projectId === project.id);
    const coverage = metric?.automationCoverage ?? 0;
    const xrayTotal = (metric?.manualTests ?? 0) + (metric?.automatedTests ?? 0);
    const xrayRatio = xrayTotal ? ((metric?.automatedTests ?? 0) / xrayTotal) * 100 : 0;

    return {
      name: project.name,
      coverage,
      xrayRatio,
      responsiveness: rating?.responsiveness ?? 0,
      availability: rating?.availability ?? 0,
      complexityUnderstanding: rating?.complexityUnderstanding ?? 0,
      defects: metric?.prodDefectsLeaked ?? 0,
      score: projectScore?.overallScore ?? 0,
      meetsCoverageTarget: coverage > AUTOMATION_COVERAGE_TARGET,
      hasMetric: Boolean(metric),
      hasRating: Boolean(rating),
      qualitativeAvg: rating
        ? (rating.responsiveness + rating.availability + rating.complexityUnderstanding) / 3
        : null,
    };
  });

  const projectScoreChart = projectRows.map((row) => ({
    name: row.name,
    score: row.score,
    coverage: row.coverage,
  }));

  const factorChart = breakdown.map((project) => {
    const weighted = weightedFactorContributions(project);
    return {
      name: project.projectName,
      ...weighted,
    };
  });

  const attributeCharts = [
    {
      title: "Automation coverage",
      subtitle: `Per-project coverage vs >${AUTOMATION_COVERAGE_TARGET}% target.`,
      testId: "attr-coverage-chart",
      data: projectRows.map((row) => ({ name: row.name, value: row.coverage })),
      domain: [0, 100] as [number, number],
      unit: "%",
      color: "#0f6a6a",
      referenceValue: AUTOMATION_COVERAGE_TARGET,
      referenceLabel: `${AUTOMATION_COVERAGE_TARGET}%`,
      alertBelowOrEqual: AUTOMATION_COVERAGE_TARGET,
    },
    {
      title: "Xray automation ratio",
      subtitle: "Automated tests as a share of documented Xray tests.",
      testId: "attr-xray-chart",
      data: projectRows.map((row) => ({ name: row.name, value: Number(row.xrayRatio.toFixed(1)) })),
      domain: [0, 100] as [number, number],
      unit: "%",
      color: "#2f7d4a",
    },
    {
      title: "Responsiveness",
      subtitle: "QM rating (1–5) across this vendor’s projects.",
      testId: "attr-responsiveness-chart",
      data: projectRows.map((row) => ({ name: row.name, value: row.responsiveness })),
      domain: [0, 5] as [number, number],
      unit: "",
      color: "#0b4f52",
    },
    {
      title: "Availability",
      subtitle: "QM rating (1–5) across this vendor’s projects.",
      testId: "attr-availability-chart",
      data: projectRows.map((row) => ({ name: row.name, value: row.availability })),
      domain: [0, 5] as [number, number],
      unit: "",
      color: "#b0893d",
    },
    {
      title: "Complexity understanding",
      subtitle: "QM rating (1–5) across this vendor’s projects.",
      testId: "attr-complexity-chart",
      data: projectRows.map((row) => ({ name: row.name, value: row.complexityUnderstanding })),
      domain: [0, 5] as [number, number],
      unit: "",
      color: "#4a5d6a",
    },
    {
      title: "Prod defects leaked",
      subtitle: "Lower is better. Count of defects leaked to production.",
      testId: "attr-defects-chart",
      data: projectRows.map((row) => ({ name: row.name, value: row.defects })),
      domain: [0, Math.max(5, ...projectRows.map((row) => row.defects))] as [number, number],
      unit: "",
      color: "#b23a2f",
      alertBelowOrEqual: undefined,
    },
  ];

  return (
    <AppShell
      title={vendor.name}
      subtitle={`Attribute graphs across all projects for ${quarter}. Vendor score averages project scores.`}
      roleLabel={session.user.role === "QUALITY_MANAGER" ? "Quality Manager" : "Leadership"}
      userName={session.user.name ?? session.user.email ?? "Viewer"}
      nav={[
        { href: `/leadership?quarter=${quarter}`, label: "Back to rankings" },
        ...(session.user.role === "QUALITY_MANAGER" ? [{ href: "/qm/ratings", label: "Ratings" }] : []),
      ]}
    >
      <section className="mb-6 rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
        <p className="text-sm text-[var(--ink-muted)]">Vendor quarterly score (avg of projects)</p>
        <p className="text-4xl font-semibold" data-testid="vendor-detail-score">
          {score ? formatScore(score.overallScore) : "—"}
        </p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {vendor.projects.length} projects ·{" "}
          {projectRows.filter((row) => row.hasMetric && row.hasRating).length} fully rated
        </p>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
          <h2 className="mb-1 text-2xl">Project scores</h2>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Green bars meet &gt;{AUTOMATION_COVERAGE_TARGET}% coverage; red bars are below target.
          </p>
          <ProjectScoreBarChart data={projectScoreChart} />
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
          <h2 className="mb-1 text-2xl">Score composition</h2>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Weighted factor contributions that sum to each project score.
          </p>
          <ProjectFactorStackedChart data={factorChart} />
        </div>
      </section>

      <section className="mb-8" data-testid="attribute-charts-section">
        <div className="mb-4">
          <h2 className="text-2xl">Attributes across projects</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Individual rating inputs for each of {vendor.name}&apos;s projects.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {attributeCharts.map((chart) => (
            <div
              key={chart.testId}
              className="rounded-2xl border border-[var(--line)] bg-white/75 p-5 shadow-[var(--shadow)]"
            >
              <h3 className="text-lg font-semibold">{chart.title}</h3>
              <p className="mb-3 text-sm text-[var(--ink-muted)]">{chart.subtitle}</p>
              <ProjectAttributeBarChart
                data={chart.data}
                testId={chart.testId}
                color={chart.color}
                domain={chart.domain}
                unit={chart.unit}
                referenceValue={chart.referenceValue}
                referenceLabel={chart.referenceLabel}
                alertBelowOrEqual={chart.alertBelowOrEqual}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
        <h2 className="mb-4 text-2xl">Project rating details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm" data-testid="project-breakdown-table">
            <thead className="border-b border-[var(--line)] text-[var(--ink-muted)]">
              <tr>
                <th className="py-2 pr-3 font-semibold">Project</th>
                <th className="py-2 pr-3 font-semibold">Coverage</th>
                <th className="py-2 pr-3 font-semibold">Target</th>
                <th className="py-2 pr-3 font-semibold">Xray auto %</th>
                <th className="py-2 pr-3 font-semibold">Resp.</th>
                <th className="py-2 pr-3 font-semibold">Avail.</th>
                <th className="py-2 pr-3 font-semibold">Complexity</th>
                <th className="py-2 pr-3 font-semibold">Defects</th>
                <th className="py-2 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {projectRows.map((row) => (
                <tr key={row.name} className="border-b border-[var(--line)]/70">
                  <td className="py-3 pr-3 font-semibold">{row.name}</td>
                  <td className="py-3 pr-3">{row.hasMetric ? `${row.coverage}%` : "—"}</td>
                  <td
                    className={`py-3 pr-3 ${
                      row.meetsCoverageTarget ? "text-[var(--ok)]" : "text-[var(--alert)]"
                    }`}
                  >
                    {row.hasMetric ? (row.meetsCoverageTarget ? "Pass" : "Below") : "—"}
                  </td>
                  <td className="py-3 pr-3">{row.hasMetric ? `${row.xrayRatio.toFixed(0)}%` : "—"}</td>
                  <td className="py-3 pr-3">{row.hasRating ? row.responsiveness : "—"}</td>
                  <td className="py-3 pr-3">{row.hasRating ? row.availability : "—"}</td>
                  <td className="py-3 pr-3">{row.hasRating ? row.complexityUnderstanding : "—"}</td>
                  <td className="py-3 pr-3">{row.hasMetric ? row.defects : "—"}</td>
                  <td className="py-3">{row.score ? formatScore(row.score) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          <Link href={`/leadership?quarter=${quarter}`} className="font-semibold text-[var(--sea)]">
            ← Return to ranking
          </Link>
        </p>
      </section>
    </AppShell>
  );
}
