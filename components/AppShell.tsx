import Link from "next/link";
import { signOut } from "@/lib/auth";

type AppShellProps = {
  title: string;
  subtitle: string;
  roleLabel: string;
  userName: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, roleLabel, userName, nav, children }: AppShellProps) {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-8 flex flex-col gap-6 border-b border-[var(--line)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold tracking-[0.14em] text-[var(--sea)] uppercase">
            Vendor Quality
          </p>
          <h1 className="text-3xl text-[var(--ink)] md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">{subtitle}</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <p className="text-sm text-[var(--ink-muted)]">
            {userName} · {roleLabel}
          </p>
          <nav className="flex flex-wrap gap-3 text-sm font-semibold">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md bg-[var(--sea)] px-3 py-2 text-white transition hover:bg-[var(--sea-deep)]"
              >
                {item.label}
              </Link>
            ))}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-[var(--line)] bg-white/70 px-3 py-2 text-[var(--ink)] transition hover:bg-white"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
