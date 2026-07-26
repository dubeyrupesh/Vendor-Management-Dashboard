import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatScore } from "@/lib/utils";
import { AUTOMATION_COVERAGE_TARGET } from "@/lib/scoring/weights";

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

  return (
    <AppShell
      title={vendor.name}
      subtitle={`Project-level quality breakdown for ${quarter}.`}
      roleLabel={session.user.role === "QUALITY_MANAGER" ? "Quality Manager" : "Leadership"}
      userName={session.user.name ?? session.user.email ?? "Viewer"}
      nav={[
        { href: `/leadership?quarter=${quarter}`, label: "Back to rankings" },
        ...(session.user.role === "QUALITY_MANAGER" ? [{ href: "/qm/ratings", label: "Ratings" }] : []),
      ]}
    >
      <section className="mb-6 rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
        <p className="text-sm text-[var(--ink-muted)]">Overall quarterly score</p>
        <p className="text-4xl font-semibold" data-testid="vendor-detail-score">
          {score ? formatScore(score.overallScore) : "—"}
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
        <h2 className="mb-4 text-2xl">Projects</h2>
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
