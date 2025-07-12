import {
  TYPED_HANDLERS_ERROR_STATUS_CODES_BY_KEY,
  TypedHandlersError,
} from "@asyncstatus/typed-handlers";
import { typedHandlersHonoServer } from "@asyncstatus/typed-handlers/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  AsyncStatusApiError,
  type AsyncStatusApiJsonError,
  AsyncStatusUnexpectedApiError,
} from "./errors";
import { createContext, type HonoEnv } from "./lib/env";
import { queue } from "./queue";
import { authRouter } from "./routers/auth";
import { githubWebhooksRouter } from "./routers/github-webhooks";
import { githubRouter } from "./routers/organization/github";
import { getFileHandler } from "./typed-handlers/file-handlers";
import {
  acceptInvitationHandler,
  cancelInvitationHandler,
  getInvitationHandler,
  listUserInvitationsHandler,
  rejectInvitationHandler,
} from "./typed-handlers/invitation-handlers";
import {
  getMemberHandler,
  inviteMemberHandler,
  listMembersHandler,
  updateMemberHandler,
} from "./typed-handlers/member-handlers";
import {
  createOrganizationHandler,
  getOrganizationHandler,
  listMemberOrganizationsHandler,
  setActiveOrganizationHandler,
  updateOrganizationHandler,
} from "./typed-handlers/organization-handlers";
import {
  deleteStatusUpdateHandler,
  getStatusUpdateHandler,
  listStatusUpdatesByDateHandler,
  listStatusUpdatesByMemberHandler,
  listStatusUpdatesByTeamHandler,
  listStatusUpdatesHandler,
  upsertStatusUpdateHandler,
} from "./typed-handlers/status-update-handlers";
import {
  addTeamMemberHandler,
  createTeamHandler,
  deleteTeamHandler,
  deleteTeamMemberHandler,
  getTeamHandler,
  getTeamMembersHandler,
  listTeamsHandler,
  updateTeamHandler,
} from "./typed-handlers/team-handlers";
import { joinWaitlistHandler } from "./typed-handlers/waitlist-handlers";

const app = new Hono<HonoEnv>()
  .use(
    "*",
    cors({
      origin: (origin, c) => {
        if (c.env.NODE_ENV === "development") {
          return origin;
        }
        if (origin.endsWith("asyncstatus.com")) {
          return origin;
        }
        return "https://app.asyncstatus.com";
      },
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "Content-Disposition",
        "Content-Length",
        "ETag",
        "Cache-Control",
      ],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      maxAge: 600,
      credentials: true,
    }),
  )
  .use(async (c, next) => {
    const context = await createContext(c);
    c.set("db", context.db);
    c.set("resend", context.resend);
    c.set("auth", context.auth);
    c.set("rateLimiter" as any, context.rateLimiter);
    c.set("anthropicClient", context.anthropicClient);
    c.set("voyageClient", context.voyageClient);
    c.set("githubWebhooks", context.githubWebhooks);
    c.set("session" as any, context.session);
    return next();
  })
  .route("/auth", authRouter)
  .route("/organization", githubRouter)
  .route("/github/webhooks", githubWebhooksRouter)
  .onError((err, c) => {
    console.error(err);
    if (err instanceof TypedHandlersError) {
      return c.json(
        { type: err.name, message: err.message, code: err.code, cause: err.cause },
        TYPED_HANDLERS_ERROR_STATUS_CODES_BY_KEY[
          err.code ?? "INTERNAL_SERVER_ERROR"
        ] as ContentfulStatusCode,
      );
    }
    if (err instanceof AsyncStatusUnexpectedApiError) {
      return c.json({ type: err.name, message: err.message }, err.status);
    }
    if (err instanceof AsyncStatusApiError) {
      return c.json({ type: err.name, message: err.message }, err.status);
    }
    const error = {
      type: "ASAPIUnexpectedError",
      message: "An unexpected error occurred. Please try again later.",
    } satisfies AsyncStatusApiJsonError;
    return c.json(error, 500);
  });

const typedHandlersApp = typedHandlersHonoServer(
  app.basePath("/th"),
  [
    joinWaitlistHandler,
    listUserInvitationsHandler,
    getInvitationHandler,
    cancelInvitationHandler,
    acceptInvitationHandler,
    rejectInvitationHandler,
    updateMemberHandler,
    getMemberHandler,
    listMembersHandler,
    inviteMemberHandler,
    getFileHandler,
    listMemberOrganizationsHandler,
    getOrganizationHandler,
    setActiveOrganizationHandler,
    createOrganizationHandler,
    updateOrganizationHandler,
    listTeamsHandler,
    getTeamHandler,
    getTeamMembersHandler,
    createTeamHandler,
    updateTeamHandler,
    deleteTeamHandler,
    addTeamMemberHandler,
    deleteTeamMemberHandler,
    listStatusUpdatesHandler,
    listStatusUpdatesByMemberHandler,
    listStatusUpdatesByDateHandler,
    listStatusUpdatesByTeamHandler,
    getStatusUpdateHandler,
    upsertStatusUpdateHandler,
    deleteStatusUpdateHandler,
  ],
  {
    getContext: (c) => ({
      db: c.get("db"),
      session: c.get("session"),
      resend: c.get("resend"),
      auth: c.get("auth"),
      rateLimiter: c.get("rateLimiter"),
      anthropicClient: c.get("anthropicClient"),
      voyageClient: c.get("voyageClient"),
      githubWebhooks: c.get("githubWebhooks"),
      bucket: { private: c.env.PRIVATE_BUCKET },
      authKv: c.env.AS_PROD_AUTH_KV,
      organization: c.get("organization" as any),
      member: c.get("member" as any),
      webAppUrl: c.env.WEB_APP_URL,
    }),
  },
);

export default {
  fetch: typedHandlersApp.fetch,
  queue: queue,
};
export type App = typeof app;
export { GenerateStatusWorkflow } from "./workflows/generate-status";
export { DeleteGithubIntegrationWorkflow } from "./workflows/github/delete-github-integration";
export { SyncGithubWorkflow } from "./workflows/github/sync-github-v2";
