import ResetPassword from "@asyncstatus/email/auth/reset-password-email";
import VerificationEmail from "@asyncstatus/email/auth/verification-email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession, jwt } from "better-auth/plugins";
import { desc, eq } from "drizzle-orm";
import type { Resend } from "resend";
import * as schema from "../db";
import type { Db } from "../db/db";
import { authCookiesPlugin } from "./auth-cookies-plugin";
import type { Bindings } from "./env";

export function createAuth(env: Bindings, db: Db, resend: Resend) {
  return betterAuth({
    appName: "AsyncStatus",
    url: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      async sendResetPassword(data) {
        await resend.emails.send({
          from: "AsyncStatus <onboarding@a.asyncstatus.com>",
          to: data.user.email,
          subject: "Reset your password",
          text: `Reset your password ${data.url}`,
          react: (
            <ResetPassword
              firstName={data.user.name}
              resetLink={data.url}
              expiration="1 hour"
              preview={`Reset your password ${data.url}`}
            />
          ),
        });
      },
    },
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:8787",
      "https://asyncstatus.com",
      "https://dev.asyncstatus.com",
      "https://beta.asyncstatus.com",
      "https://api.asyncstatus.com",
      "https://app.asyncstatus.com",
      "https://app-v2.asyncstatus.com",
      "https://supposedly-simple-mallard.ngrok-free.app",
    ],
    emailVerification: {
      autoSignInAfterVerification: true,
      async sendVerificationEmail(data) {
        const firstName = data.user.name?.split(" ")[0] ?? data.user.name;
        await resend.emails.send({
          from: "AsyncStatus <onboarding@a.asyncstatus.com>",
          to: data.user.email,
          subject: "Verify your account",
          text: `${firstName}, verify your AsyncStatus account ${data.url}`,
          react: (
            <VerificationEmail
              firstName={firstName}
              preview={`${firstName}, verify your AsyncStatus account ${data.url}`}
              verificationLink={data.url}
              expiration="1 hour"
            />
          ),
        });
      },
    },
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      additionalFields: {
        activeOrganizationSlug: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    user: {
      additionalFields: {
        activeOrganizationSlug: {
          type: "string",
          required: false,
          input: false,
        },
        timezone: {
          type: "string",
          required: true,
          input: false,
          defaultValue: "UTC",
        },
        autoDetectTimezone: {
          type: "boolean",
          required: true,
          input: false,
          defaultValue: true,
        },
      },
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
      defaultCookieAttributes: {
        domain: env.NODE_ENV === "production" ? ".asyncstatus.com" : undefined,
        secure: env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
      },
      crossSubDomainCookies: {
        enabled: true,
        domain: env.NODE_ENV === "production" ? ".asyncstatus.com" : undefined,
      },
      cookiePrefix: "as",
      useSecureCookies: env.NODE_ENV === "production",
    },
    plugins: [
      customSession(async (session) => {
        let activeOrganizationSlug =
          (session.user as any).activeOrganizationSlug ||
          (session.session as any).activeOrganizationSlug;
        if (!activeOrganizationSlug) {
          const orgs = await db
            .select({ organization: schema.organization, member: schema.member })
            .from(schema.organization)
            .innerJoin(schema.member, eq(schema.organization.id, schema.member.organizationId))
            .where(eq(schema.member.userId, session.user.id))
            .orderBy(desc(schema.organization.createdAt))
            .limit(100);
          activeOrganizationSlug = orgs[0]?.organization.slug;
        }
        return { ...session, session: { ...session.session, activeOrganizationSlug } };
      }),
      authCookiesPlugin(),
      jwt({
        jwt: {
          definePayload(session) {
            return session;
          },
          expirationTime: "30 days",
          audience: env.BETTER_AUTH_URL,
          issuer: env.BETTER_AUTH_URL,
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
