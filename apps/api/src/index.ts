import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Resend } from "resend";

import { createDb } from "./db";
import {
  AsyncStatusExpectedApiError,
  AsyncStatusUnexpectedApiError,
} from "./errors";
import { createAuth } from "./lib/auth";
import type { HonoEnv } from "./lib/env";
import { createRateLimiter } from "./lib/rate-limiter";
import { authRouter } from "./routers/auth";
import { invitationRouter } from "./routers/invitation";
import { memberRouter } from "./routers/organization/member";
import { organizationRouter } from "./routers/organization/organization";
import { publicShareRouter as organizationPublicShareRouter } from "./routers/organization/publicShare";
import { statusUpdateRouter } from "./routers/organization/statusUpdate";
import { teamsRouter } from "./routers/organization/teams";
import { publicStatusShareRouter } from "./routers/publicStatusShare";
import { slackRouter } from "./routers/slack";
import { waitlistRouter } from "./routers/waitlist";
import { createSlackbot } from "./slackbot";

const app = new Hono<HonoEnv>()
  .use(
    cors({
      origin: [
        "http://localhost:3000",
        "https://www.asyncstatus.com",
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

    // Initialize Slackbot with db access
    const slackbot = c.env.SLACK_BOT_TOKEN && c.env.SLACK_SIGNING_SECRET 
      ? {
        token: c.env.SLACK_BOT_TOKEN,
        signingSecret: c.env.SLACK_SIGNING_SECRET,
        db
      }
      : null;
    
    if (slackbot) {
      // Create slackbot instance with db access
      const slackbotInstance = createSlackbot(slackbot);
      // Store slackbot instance in app context
      c.set("slackbot", slackbotInstance);
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      c.set("session", null);
      return next();
    }

    c.set("session", session);
    return next();
  })
  .route("/auth", authRouter)
  .route("/organization", organizationRouter)
  .route("/organization", memberRouter)
  .route("/organization", teamsRouter)
  .route("/organization", statusUpdateRouter)
  .route("/organization", organizationPublicShareRouter)
  .route("/public-status-share", publicStatusShareRouter)
  .route("/invitation", invitationRouter)
  .route("/waitlist", waitlistRouter)
  .route("/slack", slackRouter)
  .onError((err, c) => {
    console.log(err);
    if (err instanceof AsyncStatusUnexpectedApiError) {
      return c.json({ message: err.message }, err.status);
    }
    if (err instanceof AsyncStatusExpectedApiError) {
      return c.json({ message: err.message }, err.status);
    }
    return c.json({ message: "Internal Server Error" }, 500);
  });

export default app;
export type App = typeof app;
