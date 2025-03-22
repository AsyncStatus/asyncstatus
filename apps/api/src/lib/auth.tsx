import VerificationEmail from "@asyncstatus/email/auth/verification-email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Resend } from "resend";

import * as schema from "../db/schema";
import type { Bindings } from "./env";

export function createAuth(env: Bindings, db: LibSQLDatabase, resend: Resend) {
  return betterAuth({
    appName: "AsyncStatus",
    url: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: true },
    trustedOrigins: [
      "http://localhost:3000",
      "https://app.asyncstatus.com",
      "https://app.dev.asyncstatus.com",
    ],
    emailVerification: {
      autoSignInAfterVerification: true,
      sendOnSignUp: true,
      async sendVerificationEmail(data) {
        await resend.emails.send({
          from: "AsyncStatus <onboarding@a.asyncstatus.com>",
          to: data.user.email,
          subject: "Verify your email",
          react: (
            <VerificationEmail
              firstName={data.user.name}
              preview={`Verify your email ${data.url}`}
              verificationLink={data.url}
            />
          ),
        });
      },
    },
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    session: {
      cookieCache: { enabled: true },
      expiresIn: 60 * 60 * 24 * 30, // 30 days
    },
    secondaryStorage: {
      set(key, value, ttl) {
        return env.AS_PROD_AUTH_KV.put(key, value, { expirationTtl: ttl });
      },
      get(key) {
        return env.AS_PROD_AUTH_KV.get(key);
      },
      delete(key) {
        return env.AS_PROD_AUTH_KV.delete(key);
      },
    },
    basePath: "/auth",
    baseUrl: env.BETTER_AUTH_URL,
    rateLimit: {
      enabled: true,
      storage: "secondary-storage",
      customRules: {
        "/get-session": {
          max: 200,
          window: 60,
        },
      },
    },
    advanced: {
      cookiePrefix: "as",
    },
    plugins: [
      organization({ teams: { enabled: true, allowRemovingAllTeams: false } }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
