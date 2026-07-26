import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "QUALITY_MANAGER" | "LEADERSHIP";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "QUALITY_MANAGER" | "LEADERSHIP";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "QUALITY_MANAGER" | "LEADERSHIP";
  }
}
