import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { AUTOMATION_COVERAGE_TARGET } from "@/lib/scoring/weights";
import { refreshStubDataAction, saveQuarterlyRatingAction } from "../actions";

export default async function RatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string; projectId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const quarter = params.quarter ?? "2026-Q2";

  const projects = await prisma.project.findMany({
    where: { active: true },
    include: {
      vendor: true,
      metrics: { where: { quarter } },
      ratings: { where: { quarter } },
    },
    orderBy: [{ vendor: { name: "asc" } }, { name: "asc" }],
  });

  const selected =
    projects.find((project) => project.id === params.projectId) ?? projects[0] ?? null;
  const metric = selected?.metrics[0];
  const rating = selected?.ratings[0];

  return (
    <AppShell
      title="Quarterly ratings"
      subtitle={`Enter metrics and qualitative scores. Automation coverage target is > ${AUTOMATION_COVERAGE_TARGET}%.`}
      roleLabel="Quality Manager"
      userName={session.user.name ?? session.user.email ?? "QM"}
      nav={[
        { href: "/qm", label: "Vendors" },
        { href: "/qm/ratings", label: "Ratings" },
        { href: "/leadership", label: "Leadership view" },
      ]}
    >
      <form className="mb-6 flex flex-wrap items-end gap-3" data-testid="quarter-filter">
        <label className="text-sm font-semibold">
          Quarter
          <input
            name="quarter"
            defaultValue={quarter}
            className="mt-1 block rounded-md border border-[var(--line)] px-3 py-2"
            data-testid="quarter-input"
          />
        </label>
        <label className="text-sm font-semibold">
          Project
          <select
            name="projectId"
            defaultValue={selected?.id}
            className="mt-1 block min-w-64 rounded-md border border-[var(--line)] px-3 py-2"
            data-testid="rating-project-select"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.vendor.name} — {project.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md border border-[var(--line)] bg-white px-4 py-2 font-semibold">
          Load
        </button>
      </form>

      {!selected ? (
        <p>No projects available. Create a vendor and project first.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
            <h2 className="text-2xl">
              {selected.vendor.name} · {selected.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Required testing: {selected.requiredTestTypes.join(", ")}
            </p>

            <form action={saveQuarterlyRatingAction} className="mt-5 grid gap-3 sm:grid-cols-2" data-testid="rating-form">
              <input type="hidden" name="projectId" value={selected.id} />
              <input type="hidden" name="quarter" value={quarter} />

              <label className="text-sm font-semibold">
                Automation coverage %
                <input
                  name="automationCoverage"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  required
                  defaultValue={metric?.automationCoverage ?? 80}
                  className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                  data-testid="coverage-input"
                />
              </label>
              <label className="text-sm font-semibold">
                Prod defects leaked
                <input
                  name="prodDefectsLeaked"
                  type="number"
                  min={0}
                  required
                  defaultValue={metric?.prodDefectsLeaked ?? 0}
                  className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                  data-testid="defects-input"
                />
              </label>
              <label className="text-sm font-semibold">
                Manual tests (Xray)
                <input
                  name="manualTests"
                  type="number"
                  min={0}
                  required
                  defaultValue={metric?.manualTests ?? 0}
                  className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                  data-testid="manual-tests-input"
                />
              </label>
              <label className="text-sm font-semibold">
                Automated tests (Xray)
                <input
                  name="automatedTests"
                  type="number"
                  min={0}
                  required
                  defaultValue={metric?.automatedTests ?? 0}
                  className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                  data-testid="automated-tests-input"
                />
              </label>
              <label className="text-sm font-semibold">
                Responsiveness (1-5)
                <input
                  name="responsiveness"
                  type="number"
                  min={1}
                  max={5}
                  required
                  defaultValue={rating?.responsiveness ?? 4}
                  className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                  data-testid="responsiveness-input"
                />
              </label>
              <label className="text-sm font-semibold">
                Availability (1-5)
                <input
                  name="availability"
                  type="number"
                  min={1}
                  max={5}
                  required
                  defaultValue={rating?.availability ?? 4}
                  className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                  data-testid="availability-input"
                />
              </label>
              <label className="text-sm font-semibold">
                Complexity understanding (1-5)
                <input
                  name="complexityUnderstanding"
                  type="number"
                  min={1}
                  max={5}
                  required
                  defaultValue={rating?.complexityUnderstanding ?? 4}
                  className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                  data-testid="complexity-input"
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Notes
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={rating?.notes ?? ""}
                  className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                  data-testid="notes-input"
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-[var(--sea)] px-4 py-2 font-semibold text-white sm:col-span-2"
                data-testid="rating-submit"
              >
                Save quarterly rating
              </button>
            </form>
          </section>

          <aside className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
            <h2 className="text-2xl">Stub integrations</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Pull demo GitLab coverage/defects and Jira/Xray test counts for this project and quarter.
            </p>
            <form action={refreshStubDataAction} className="mt-4">
              <input type="hidden" name="projectId" value={selected.id} />
              <input type="hidden" name="quarter" value={quarter} />
              <button
                type="submit"
                className="rounded-md border border-[var(--line)] bg-[var(--sand)]/40 px-4 py-2 font-semibold"
                data-testid="refresh-stub-button"
              >
                Refresh stub data
              </button>
            </form>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ink-muted)]">Current source</dt>
                <dd>{metric?.source ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--ink-muted)]">Coverage</dt>
                <dd data-testid="current-coverage">{metric ? `${metric.automationCoverage}%` : "—"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
