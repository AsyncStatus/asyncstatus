import ResetPassword from "@asyncstatus/email/auth/reset-password-email";
import VerificationEmail from "@asyncstatus/email/auth/verification-email";
import OrganizationInvitationEmail from "@asyncstatus/email/organization/organization-invitation-email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";
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
      "https://app-v2.asyncstatus.com",
      "https://app-v2.dev.asyncstatus.com",
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
        async sendInvitationEmail(data, request) {
          const params = new URLSearchParams();
          params.set("invitationId", data.invitation.id);
          params.set("invitationEmail", data.email);
          const inviteLink = `${env.WEB_APP_URL}/invitation?${params.toString()}`;
          const invitedByUsername =
            data.inviter.user.name?.split(" ")[0] ?? data.inviter.user.name;
          const invitation = await db.query.invitation.findFirst({
            where: eq(schema.invitation.id, data.invitation.id),
          });
          if (!invitation) {
            throw new Error("Invitation not found");
          }
          const firstName = invitation.name?.split(" ")[0] ?? "";

          await resend.emails.send({
            from: "AsyncStatus <onboarding@a.asyncstatus.com>",
            to: data.email,
            subject: `${invitedByUsername} invited you to ${data.organization.name}`,
            text: `${invitedByUsername} invited you to ${data.organization.name}, accept invitation before it expires.`,
            react: (
              <OrganizationInvitationEmail
                inviteeFirstName={firstName}
                invitedByUsername={invitedByUsername}
                invitedByEmail={data.inviter.user.email}
                teamName={data.organization.name}
                inviteLink={inviteLink}
                expiration="48 hours"
                preview={`${invitedByUsername} invited you to ${data.organization.name}, accept invitation before it expires.`}
              />
            ),
          });
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
