import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { StatPill } from "@/components/StatPill";
import { PeriodFilter } from "@/components/PeriodFilter";
import { formatScore } from "@/lib/utils";
import { AUTOMATION_COVERAGE_TARGET } from "@/lib/scoring/weights";
import { VendorScoreBarChart } from "@/components/charts/VendorScoreBarChart";
import { VendorFactorRadarChart } from "@/components/charts/VendorFactorRadarChart";
import { CoverageGroupedBarChart } from "@/components/charts/CoverageGroupedBarChart";
import { buildPeriodOptions, parsePeriodSearchParams, periodQueryString } from "@/lib/periods";
import { getVendorPeriodRows, listAvailableQuarters } from "@/lib/reporting/period-aggregates";

function shortVendorName(name: string) {
  return name.replace(/\s+(Partners|Collective|Labs|Testing)?$/i, "").trim() || name;
}

export default async function LeadershipPage({
  searchParams,
}: {
  searchParams: Promise<{ periodType?: string; period?: string; quarter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const selection = parsePeriodSearchParams(params);
  const availableQuarters = await listAvailableQuarters();
  const periodOptions = buildPeriodOptions(availableQuarters);
  const { label, quarters, rows } = await getVendorPeriodRows(selection);
  const query = periodQueryString(selection);

  const totalProjects = rows.reduce((sum, row) => sum + row.projectCount, 0);
  const belowTarget = rows.reduce(
    (count, row) => count + row.projects.filter((project) => !project.meetsCoverageTarget).length,
    0,
  );

  const rankChartData = rows.map((row) => ({
    name: shortVendorName(row.vendorName),
    score: row.overallScore,
  }));

  const coverageChartData = rows.map((row) => ({
    name: shortVendorName(row.vendorName),
    avgCoverage: Number(row.avgCoverage.toFixed(1)),
    pctMeetingTarget: row.pctMeetingTarget,
  }));

  const factorRadarData = rows.map((row) => ({
    vendor: shortVendorName(row.vendorName),
    coverage: Number(row.factorAverages.coverage.toFixed(1)),
    xray: Number(row.factorAverages.xray.toFixed(1)),
    qualitative: Number(row.factorAverages.qualitative.toFixed(1)),
    defects: Number(row.factorAverages.defects.toFixed(1)),
  }));

  return (
    <AppShell
      title="Leadership ranking"
      subtitle="Project ratings roll up to each vendor. Switch between quarterly, half-yearly, and yearly views."
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
      <PeriodFilter selection={selection} options={periodOptions} testId="leadership-period-filter" />

      <p className="mb-6 text-sm text-[var(--ink-muted)]" data-testid="period-summary">
        Showing <span className="font-semibold text-[var(--ink)]">{label}</span>
        {quarters.length > 1 ? ` · averaged across ${quarters.join(", ")}` : null}
      </p>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Vendors ranked" value={String(rows.length)} />
        <StatPill label="Projects rated" value={String(totalProjects)} />
        <StatPill
          label="Top vendor score"
          value={rows[0] ? formatScore(rows[0].overallScore) : "—"}
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
            Average of project scores for {label}.
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
        <h2 className="mb-4 text-2xl">Vendor ranking · {label}</h2>
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
              {rows.map((row, index) => (
                <tr key={row.vendorId} className="border-b border-[var(--line)]/70" data-testid="vendor-rank-row">
                  <td className="py-3 pr-4 font-semibold">{index + 1}</td>
                  <td className="py-3 pr-4">{row.vendorName}</td>
                  <td className="py-3 pr-4" data-testid="vendor-overall-score">
                    {formatScore(row.overallScore)}
                  </td>
                  <td className="py-3 pr-4">{row.projectCount}</td>
                  <td className="py-3 pr-4">
                    {row.ratedCount}/{row.projectCount}
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/leadership/vendors/${row.vendorId}?${query}`}
                      className="font-semibold text-[var(--sea)]"
                      data-testid="vendor-detail-link"
                    >
                      View projects
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-[var(--ink-muted)]">
                    No scores for this period yet.
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
