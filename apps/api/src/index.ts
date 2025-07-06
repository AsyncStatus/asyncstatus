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
import { invitationRouter } from "./routers/invitation";
import { githubRouter } from "./routers/organization/github";
import { memberRouter } from "./routers/organization/member";
import { organizationRouter } from "./routers/organization/organization";
import { publicShareRouter as organizationPublicShareRouter } from "./routers/organization/publicShare";
import { statusUpdateRouter } from "./routers/organization/statusUpdate";
import { teamsRouter } from "./routers/organization/teams";
import { waitlistRouter } from "./routers/waitlist";
import { getFileHandler } from "./typed-handlers/file-handlers";
import { getInvitationHandler } from "./typed-handlers/invitation-handlers";
import { getMemberHandler, updateMemberHandler } from "./typed-handlers/member-handlers";
import {
  createOrganizationHandler,
  getOrganizationHandler,
  listOrganizationsHandler,
  setActiveOrganizationHandler,
  updateOrganizationHandler,
} from "./typed-handlers/organization-handlers";
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
    c.set("waitlistRateLimiter", context.waitlistRateLimiter);
    c.set("anthropicClient", context.anthropicClient);
    c.set("voyageClient", context.voyageClient);
    c.set("githubWebhooks", context.githubWebhooks);
    c.set("session" as any, context.session);
    return next();
  })
  .route("/auth", authRouter)
  .route("/organization", githubRouter)
  .route("/organization", organizationRouter)
  .route("/organization", memberRouter)
  .route("/organization", teamsRouter)
  .route("/organization", statusUpdateRouter)
  .route("/organization", organizationPublicShareRouter)
  .route("/invitation", invitationRouter)
  .route("/waitlist", waitlistRouter)
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
    getInvitationHandler,
    updateMemberHandler,
    getMemberHandler,
    getFileHandler,
    getOrganizationHandler,
    listOrganizationsHandler,
    setActiveOrganizationHandler,
    createOrganizationHandler,
    updateOrganizationHandler,
  ],
  {
    getContext: (c) => ({
      db: c.get("db"),
      session: c.get("session"),
      resend: c.get("resend"),
      auth: c.get("auth"),
      waitlistRateLimiter: c.get("waitlistRateLimiter"),
      anthropicClient: c.get("anthropicClient"),
      voyageClient: c.get("voyageClient"),
      githubWebhooks: c.get("githubWebhooks"),
      bucket: { private: c.env.PRIVATE_BUCKET },
      authKv: c.env.AS_PROD_AUTH_KV,
      organization: c.get("organization" as any),
      member: c.get("member" as any),
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
