import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { StatPill } from "@/components/StatPill";
import { formatScore } from "@/lib/utils";
import { AUTOMATION_COVERAGE_TARGET } from "@/lib/scoring/weights";
import { VendorRankChart } from "@/components/VendorRankChart";

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
            },
          },
        },
      },
    },
    orderBy: { overallScore: "desc" },
  });

  const belowTarget = scores.reduce((count, score) => {
    const projects = score.vendor.projects;
    const failing = projects.filter((project) => {
      const coverage = project.metrics[0]?.automationCoverage ?? 0;
      return coverage <= AUTOMATION_COVERAGE_TARGET;
    }).length;
    return count + failing;
  }, 0);

  const chartData = scores.map((score) => ({
    name: score.vendor.name.replace(/\s+(Partners|Collective|Labs)$/i, ""),
    score: score.overallScore,
  }));

  return (
    <AppShell
      title="Leadership quarterly ranking"
      subtitle="Vendor quality scores for testing services, rolled up from project metrics and QM ratings."
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

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <StatPill label="Vendors ranked" value={String(scores.length)} />
        <StatPill
          label="Top score"
          value={scores[0] ? formatScore(scores[0].overallScore) : "—"}
          tone="ok"
        />
        <StatPill
          label={`Projects ≤ ${AUTOMATION_COVERAGE_TARGET}% coverage`}
          value={String(belowTarget)}
          tone={belowTarget > 0 ? "alert" : "ok"}
        />
      </section>

      <section className="mb-8 rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
        <h2 className="mb-4 text-2xl">Score overview</h2>
        <VendorRankChart data={chartData} />
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
                <th className="py-2 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={score.id} className="border-b border-[var(--line)]/70" data-testid="vendor-rank-row">
                  <td className="py-3 pr-4 font-semibold">{index + 1}</td>
                  <td className="py-3 pr-4">{score.vendor.name}</td>
                  <td className="py-3 pr-4" data-testid="vendor-overall-score">
                    {formatScore(score.overallScore)}
                  </td>
                  <td className="py-3 pr-4">{score.vendor.projects.length}</td>
                  <td className="py-3">
                    <Link
                      href={`/leadership/vendors/${score.vendorId}?quarter=${quarter}`}
                      className="font-semibold text-[var(--sea)]"
                      data-testid="vendor-detail-link"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-[var(--ink-muted)]">
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
