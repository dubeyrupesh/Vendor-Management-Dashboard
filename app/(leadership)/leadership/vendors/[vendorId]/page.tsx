import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatScore } from "@/lib/utils";
import { AUTOMATION_COVERAGE_TARGET, weightedFactorContributions } from "@/lib/scoring/weights";
import { ProjectScoreBarChart } from "@/components/charts/ProjectScoreBarChart";
import { ProjectFactorStackedChart } from "@/components/charts/ProjectFactorStackedChart";

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

  const projectScoreChart = vendor.projects.map((project) => {
    const metric = project.metrics[0];
    const projectScore = breakdown.find((item) => item.projectId === project.id);
    return {
      name: project.name,
      score: projectScore?.overallScore ?? 0,
      coverage: metric?.automationCoverage ?? 0,
    };
  });

  const factorChart = breakdown.map((project) => {
    const weighted = weightedFactorContributions(project);
    return {
      name: project.projectName,
      ...weighted,
    };
  });

  return (
    <AppShell
      title={vendor.name}
      subtitle={`Every project is rated for ${quarter}; vendor score is the average of project scores.`}
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
          {
            vendor.projects.filter((project) => project.metrics[0] && project.ratings[0]).length
          }{" "}
          fully rated
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
                <th className="py-2 pr-3 font-semibold">Qualitative</th>
                <th className="py-2 pr-3 font-semibold">Defects</th>
                <th className="py-2 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {vendor.projects.map((project) => {
                const metric = project.metrics[0];
                const rating = project.ratings[0];
                const projectScore = breakdown.find((item) => item.projectId === project.id);
                const coverage = metric?.automationCoverage ?? 0;
                const meets = coverage > AUTOMATION_COVERAGE_TARGET;
                const xrayTotal = (metric?.manualTests ?? 0) + (metric?.automatedTests ?? 0);
                const xrayRatio = xrayTotal ? ((metric?.automatedTests ?? 0) / xrayTotal) * 100 : 0;
                const qualitative = rating
                  ? (rating.responsiveness + rating.availability + rating.complexityUnderstanding) / 3
                  : null;

                return (
                  <tr key={project.id} className="border-b border-[var(--line)]/70">
                    <td className="py-3 pr-3 font-semibold">{project.name}</td>
                    <td className="py-3 pr-3">{metric ? `${coverage}%` : "—"}</td>
                    <td className={`py-3 pr-3 ${meets ? "text-[var(--ok)]" : "text-[var(--alert)]"}`}>
                      {metric ? (meets ? "Pass" : "Below") : "—"}
                    </td>
                    <td className="py-3 pr-3">{metric ? `${xrayRatio.toFixed(0)}%` : "—"}</td>
                    <td className="py-3 pr-3">{qualitative ? qualitative.toFixed(1) : "—"}</td>
                    <td className="py-3 pr-3">{metric?.prodDefectsLeaked ?? "—"}</td>
                    <td className="py-3">{projectScore ? formatScore(projectScore.overallScore) : "—"}</td>
                  </tr>
                );
              })}
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
