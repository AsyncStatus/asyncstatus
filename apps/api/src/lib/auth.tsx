import ResetPassword from "@asyncstatus/email/auth/reset-password";
import VerificationEmail from "@asyncstatus/email/auth/verification-email";
import OrganizationInvitationEmail from "@asyncstatus/email/organization/organization-invitation-email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import dayjs from "dayjs";
import type { Resend } from "resend";

import type { Db } from "../db";
import * as schema from "../db/schema";
import type { Bindings } from "./env";

export function createAuth(env: Bindings, db: Db, resend: Resend) {
  return betterAuth({
    appName: "AsyncStatus",
    url: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
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
          text: `Verify your email ${data.url}`,
          react: (
            <VerificationEmail
              firstName={data.user.name}
              preview={`Verify your email ${data.url}`}
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
      organization({
        teams: { enabled: true, allowRemovingAllTeams: false },
        invitationExpiresIn: 3 * 24 * 60 * 60, // 3 days
        async sendInvitationEmail(data, request) {
          const inviteLink = `${env.WEB_APP_URL}/invitation?invitationId=${data.invitation.id}`;
          await resend.emails.send({
            from: "AsyncStatus <onboarding@a.asyncstatus.com>",
            to: data.email,
            subject: `${data.inviter.user.name} invites you to ${data.organization.name}`,
            react: (
              <OrganizationInvitationEmail
                invitedByUsername={data.inviter.user.name}
                invitedByEmail={data.inviter.user.email}
                teamName={data.organization.name}
                inviteLink={inviteLink}
                expiration="3 days"
                preview={`Join ${data.organization.name}: ${inviteLink}`}
              />
            ),
          });
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
