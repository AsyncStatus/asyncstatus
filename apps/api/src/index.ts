import Anthropic from "@anthropic-ai/sdk";
import { Webhooks } from "@octokit/webhooks";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Resend } from "resend";
import { VoyageAIClient } from "voyageai";

import { createDb } from "./db";
import {
  AsyncStatusApiError,
  AsyncStatusUnexpectedApiError,
  type AsyncStatusApiJsonError,
} from "./errors";
import { createAuth } from "./lib/auth";
import type { HonoEnv } from "./lib/env";
import { createRateLimiter } from "./lib/rate-limiter";
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
import { publicStatusShareRouter } from "./routers/publicStatusShare";
import { slackRouter } from "./routers/slack";
import { userRouter } from "./routers/user";
import { waitlistRouter } from "./routers/waitlist";

const app = new Hono<HonoEnv>()
  .use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8787",
        "https://asyncstatus.com",
        "https://dev.asyncstatus.com",
        "https://beta.asyncstatus.com",
        "https://app.asyncstatus.com",
      ],
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      credentials: true,
    }),
  )
  .use(async (c, next) => {
    const db = createDb(c.env);
    c.set("db", db);
    const resend = new Resend(c.env.RESEND_API_KEY);
    c.set("resend", resend);
    const auth = createAuth(c.env, db, resend);
    c.set("auth", auth);
    const waitlistRateLimiter = createRateLimiter(c.env, {
      windowMs: 60 * 60 * 1000,
      limit: 10,
    });
    c.set("waitlistRateLimiter", waitlistRateLimiter);

    const anthropicClient = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
    c.set("anthropicClient", anthropicClient);

    const voyageClient = new VoyageAIClient({
      apiKey: c.env.VOYAGE_API_KEY,
    });
    c.set("voyageClient", voyageClient);

    const githubWebhooks = new Webhooks({
      secret: c.env.GITHUB_WEBHOOK_SECRET,
    });
    c.set("githubWebhooks", githubWebhooks);

    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      c.set("session", null);
      return next();
    }

    c.set("session", session);
    return next();
  })
  .route("/auth", authRouter)
.route("/user", userRouter)
.route("/organization", githubRouter)
.route("/organization", organizationRouter)
.route("/organization", memberRouter)
.route("/organization", teamsRouter)
.route("/organization", statusUpdateRouter)
.route("/organization", organizationPublicShareRouter)
.route("/public-status-share", publicStatusShareRouter)
.route("/invitation", invitationRouter)
.route("/waitlist", waitlistRouter)
.route("/slack", slackRouter)
.route("/github/webhooks", githubWebhooksRouter)
  .onError((err, c) => {
    console.error(err);
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

export default {
  fetch: app.fetch,
  queue: queue,
};
export type App = typeof app;
export { SyncGithubWorkflow } from "./workflows/github/sync-github-v2";
export { DeleteGithubIntegrationWorkflow } from "./workflows/github/delete-github-integration";
export { GenerateStatusWorkflow } from "./workflows/generate-status";
