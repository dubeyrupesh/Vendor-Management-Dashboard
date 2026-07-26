import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/login")) {
    if (isLoggedIn) {
      const dest = role === "QUALITY_MANAGER" ? "/qm" : "/leadership";
      return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/qm") && role !== "QUALITY_MANAGER") {
    return NextResponse.redirect(new URL("/leadership", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/qm/:path*", "/leadership/:path*"],
};
