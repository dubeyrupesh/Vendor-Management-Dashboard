import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      if (pathname.startsWith("/login")) {
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      if (pathname.startsWith("/qm") && role !== "QUALITY_MANAGER") {
        return Response.redirect(new URL("/leadership", request.nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "QUALITY_MANAGER" | "LEADERSHIP") ?? "LEADERSHIP";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
