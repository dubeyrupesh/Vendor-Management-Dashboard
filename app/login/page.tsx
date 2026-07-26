import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) {
    redirect(session.user.role === "QUALITY_MANAGER" ? "/qm" : "/leadership");
  }

  async function loginAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const callbackUrl = String(formData.get("callbackUrl") || "/");
    try {
      await signIn("credentials", { email, password, redirectTo: callbackUrl });
    } catch (error) {
      if ((error as { type?: string })?.type === "CredentialsSignin") {
        redirect("/login?error=CredentialsSignin");
      }
      throw error;
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-[var(--line)] bg-white/80 p-8 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold tracking-[0.14em] text-[var(--sea)] uppercase">Vendor Quality</p>
        <h1 className="mt-2 text-3xl">Sign in</h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Quality Managers enter ratings. Leadership reviews quarterly rankings.
        </p>

        {params.error ? (
          <p className="mt-4 rounded-md bg-[var(--alert)]/10 px-3 py-2 text-sm text-[var(--alert)]" data-testid="login-error">
            Invalid email or password.
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4" data-testid="login-form">
          <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/"} />
          <label className="block text-sm font-semibold">
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue="qm@example.com"
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
              data-testid="login-email"
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              name="password"
              type="password"
              required
              defaultValue="password123"
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
              data-testid="login-password"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--sea)] px-4 py-2.5 font-semibold text-white hover:bg-[var(--sea-deep)]"
            data-testid="login-submit"
          >
            Continue
          </button>
        </form>

        <p className="mt-6 text-xs text-[var(--ink-muted)]">
          Demo users: qm@example.com (QM) · lead@example.com (Leadership) — password123
        </p>
      </div>
    </div>
  );
}
