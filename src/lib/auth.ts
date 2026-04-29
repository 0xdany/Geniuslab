import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { appUrl } from "@/lib/env";

function originFrom(value: string | undefined) {
  if (!value) return undefined;
  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(normalized).origin;
  } catch {
    return undefined;
  }
}

const authBaseURL = appUrl();
const trustedOrigins = Array.from(
  new Set(
    [
      authBaseURL,
      process.env.APP_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.VERCEL_URL,
    ].map(originFrom).filter(Boolean),
  ),
) as string[];

export const auth = betterAuth({
  appName: "Hireboard Video Assessment",
  baseURL: authBaseURL,
  secret: process.env.BETTER_AUTH_SECRET || "development-only-secret-change-me",
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "missing-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "missing-google-client-secret",
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
