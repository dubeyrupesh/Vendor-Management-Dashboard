import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { StatPill } from "@/components/StatPill";
import { formatScore } from "@/lib/utils";
import { AUTOMATION_COVERAGE_TARGET } from "@/lib/scoring/weights";
import { VendorScoreBarChart } from "@/components/charts/VendorScoreBarChart";
import { VendorFactorRadarChart } from "@/components/charts/VendorFactorRadarChart";
import { CoverageGroupedBarChart } from "@/components/charts/CoverageGroupedBarChart";

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

function shortVendorName(name: string) {
  return name.replace(/\s+(Partners|Collective|Labs|Testing)?$/i, "").trim() || name;
}

export default async function LeadershipPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const quarter = params.quarter ?? "2026-Q2";

  const scores = await prisma.vendorQuarterScore.findMany({
    where: { quarter },
    include: {
      vendor: {
        include: {
          projects: {
            where: { active: true },
            include: {
              metrics: { where: { quarter } },
              ratings: { where: { quarter } },
            },
          },
        },
      },
    },
    orderBy: { overallScore: "desc" },
  });

  const totalProjects = scores.reduce((sum, score) => sum + score.vendor.projects.length, 0);
  const belowTarget = scores.reduce((count, score) => {
    const failing = score.vendor.projects.filter((project) => {
      const coverage = project.metrics[0]?.automationCoverage ?? 0;
      return coverage <= AUTOMATION_COVERAGE_TARGET;
    }).length;
    return count + failing;
  }, 0);

  const rankChartData = scores.map((score) => ({
    name: shortVendorName(score.vendor.name),
    score: score.overallScore,
  }));

  const coverageChartData = scores.map((score) => {
    const projects = score.vendor.projects;
    const coverages = projects.map((project) => project.metrics[0]?.automationCoverage ?? 0);
    const avgCoverage = coverages.length
      ? coverages.reduce((a, b) => a + b, 0) / coverages.length
      : 0;
    const meeting = coverages.filter((value) => value > AUTOMATION_COVERAGE_TARGET).length;
    return {
      name: shortVendorName(score.vendor.name),
      avgCoverage: Number(avgCoverage.toFixed(1)),
      pctMeetingTarget: projects.length ? Number(((meeting / projects.length) * 100).toFixed(1)) : 0,
    };
  });

  const factorRadarData = scores.map((score) => {
    const projects = (score.scoreBreakdown as { projects?: BreakdownProject[] } | null)?.projects ?? [];
    const avg = (key: keyof BreakdownProject) =>
      projects.length
        ? projects.reduce((sum, project) => sum + Number(project[key] ?? 0), 0) / projects.length
        : 0;

    return {
      vendor: shortVendorName(score.vendor.name),
      coverage: Number(avg("automationCoverageScore").toFixed(1)),
      xray: Number(avg("xrayAutomationRatioScore").toFixed(1)),
      qualitative: Number(avg("qualitativeScore").toFixed(1)),
      defects: Number(avg("prodDefectLeakageScore").toFixed(1)),
    };
  });

  return (
    <AppShell
      title="Leadership quarterly ranking"
      subtitle="Project ratings roll up to each vendor. Charts show overall score, coverage vs 80% target, and factor balance."
      roleLabel={session.user.role === "QUALITY_MANAGER" ? "Quality Manager" : "Leadership"}
      userName={session.user.name ?? session.user.email ?? "Viewer"}
      nav={[
        ...(session.user.role === "QUALITY_MANAGER"
          ? [
              { href: "/qm", label: "QM workspace" },
              { href: "/qm/ratings", label: "Ratings" },
            ]
          : []),
        { href: "/leadership", label: "Rankings" },
      ]}
    >
      <form className="mb-6 flex items-end gap-3" data-testid="leadership-quarter-filter">
        <label className="text-sm font-semibold">
          Quarter
          <input
            name="quarter"
            defaultValue={quarter}
            className="mt-1 block rounded-md border border-[var(--line)] px-3 py-2"
            data-testid="leadership-quarter-input"
          />
        </label>
        <button type="submit" className="rounded-md border border-[var(--line)] bg-white px-4 py-2 font-semibold">
          Update
        </button>
      </form>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Vendors ranked" value={String(scores.length)} />
        <StatPill label="Projects rated" value={String(totalProjects)} />
        <StatPill
          label="Top vendor score"
          value={scores[0] ? formatScore(scores[0].overallScore) : "—"}
          tone="ok"
        />
        <StatPill
          label={`Projects ≤ ${AUTOMATION_COVERAGE_TARGET}% coverage`}
          value={String(belowTarget)}
          tone={belowTarget > 0 ? "alert" : "ok"}
        />
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
          <h2 className="mb-1 text-2xl">Vendor overall scores</h2>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Average of all project scores for {quarter}.
          </p>
          <VendorScoreBarChart data={rankChartData} />
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
          <h2 className="mb-1 text-2xl">Automation coverage</h2>
          <p className="mb-4 text-sm text-[var(--ink-muted)]">
            Average coverage and share of projects above the {AUTOMATION_COVERAGE_TARGET}% target.
          </p>
          <CoverageGroupedBarChart data={coverageChartData} />
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
        <h2 className="mb-1 text-2xl">Quality factor balance</h2>
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          Vendor averages across coverage, Xray automation, qualitative ratings, and defect control.
        </p>
        <VendorFactorRadarChart data={factorRadarData} />
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
        <h2 className="mb-4 text-2xl">Vendor ranking · {quarter}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm" data-testid="vendor-rank-table">
            <thead className="border-b border-[var(--line)] text-[var(--ink-muted)]">
              <tr>
                <th className="py-2 pr-4 font-semibold">Rank</th>
                <th className="py-2 pr-4 font-semibold">Vendor</th>
                <th className="py-2 pr-4 font-semibold">Overall</th>
                <th className="py-2 pr-4 font-semibold">Projects</th>
                <th className="py-2 pr-4 font-semibold">Rated</th>
                <th className="py-2 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => {
                const ratedCount = score.vendor.projects.filter(
                  (project) => project.metrics[0] && project.ratings[0],
                ).length;
                return (
                  <tr key={score.id} className="border-b border-[var(--line)]/70" data-testid="vendor-rank-row">
                    <td className="py-3 pr-4 font-semibold">{index + 1}</td>
                    <td className="py-3 pr-4">{score.vendor.name}</td>
                    <td className="py-3 pr-4" data-testid="vendor-overall-score">
                      {formatScore(score.overallScore)}
                    </td>
                    <td className="py-3 pr-4">{score.vendor.projects.length}</td>
                    <td className="py-3 pr-4">
                      {ratedCount}/{score.vendor.projects.length}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/leadership/vendors/${score.vendorId}?quarter=${quarter}`}
                        className="font-semibold text-[var(--sea)]"
                        data-testid="vendor-detail-link"
                      >
                        View projects
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-[var(--ink-muted)]">
                    No scores for this quarter yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
