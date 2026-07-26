export function StatPill({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "ok" | "alert" }) {
  const color =
    tone === "ok" ? "text-[var(--ok)]" : tone === "alert" ? "text-[var(--alert)]" : "text-[var(--ink)]";

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 shadow-[var(--shadow)]">
      <p className="text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
