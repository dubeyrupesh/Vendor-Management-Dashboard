import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { StatPill } from "@/components/StatPill";
import { createVendorAction, createProjectAction } from "./actions";
import { TestType } from "@prisma/client";
import { redirect } from "next/navigation";

const TEST_TYPES = Object.values(TestType);

export default async function QmHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [vendors, projectCount, scoreCount] = await Promise.all([
    prisma.vendor.findMany({
      where: { active: true },
      include: { projects: { where: { active: true }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.project.count({ where: { active: true } }),
    prisma.vendorQuarterScore.count(),
  ]);

  return (
    <AppShell
      title="Quality Manager workspace"
      subtitle="Maintain vendors and projects, then enter quarterly quality ratings."
      roleLabel="Quality Manager"
      userName={session.user.name ?? session.user.email ?? "QM"}
      nav={[
        { href: "/qm", label: "Vendors" },
        { href: "/qm/ratings", label: "Ratings" },
        { href: "/leadership", label: "Leadership view" },
      ]}
    >
      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <StatPill label="Active vendors" value={String(vendors.length)} />
        <StatPill label="Active projects" value={String(projectCount)} />
        <StatPill label="Quarter scores" value={String(scoreCount)} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
          <h2 className="text-2xl">Add vendor</h2>
          <form action={createVendorAction} className="mt-4 space-y-3" data-testid="create-vendor-form">
            <label className="block text-sm font-semibold">
              Vendor name
              <input
                name="name"
                required
                className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                data-testid="vendor-name-input"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-[var(--sea)] px-4 py-2 font-semibold text-white"
              data-testid="vendor-submit"
            >
              Save vendor
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
          <h2 className="text-2xl">Add project</h2>
          <form action={createProjectAction} className="mt-4 space-y-3" data-testid="create-project-form">
            <label className="block text-sm font-semibold">
              Vendor
              <select
                name="vendorId"
                required
                className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                data-testid="project-vendor-select"
              >
                <option value="">Select vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Project name
              <input
                name="name"
                required
                className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                data-testid="project-name-input"
              />
            </label>
            <label className="block text-sm font-semibold">
              External ID (GitLab/Jira key)
              <input
                name="externalId"
                required
                className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                data-testid="project-external-id-input"
              />
            </label>
            <fieldset>
              <legend className="text-sm font-semibold">Required test types</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {TEST_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="requiredTestTypes" value={type} defaultChecked={type === "WEB"} />
                    {type}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              className="rounded-md bg-[var(--sea)] px-4 py-2 font-semibold text-white"
              data-testid="project-submit"
            >
              Save project
            </button>
          </form>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white/75 p-6 shadow-[var(--shadow)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl">Vendors & projects</h2>
          <Link href="/qm/ratings" className="text-sm font-semibold text-[var(--sea)]">
            Enter ratings →
          </Link>
        </div>
        <ul className="space-y-4" data-testid="vendor-list">
          {vendors.map((vendor) => (
            <li key={vendor.id} className="border-t border-[var(--line)] pt-4 first:border-0 first:pt-0">
              <p className="font-semibold">{vendor.name}</p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--ink-muted)]">
                {vendor.projects.map((project) => (
                  <li key={project.id}>
                    {project.name}{" "}
                    <span className="text-xs">
                      ({project.requiredTestTypes.join(", ") || "no types"}) · {project.externalId}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
