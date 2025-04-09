import { Hono } from "hono";
import { cors } from "hono/cors";
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
import { organizationSlackRouter, slackRouter } from "./routers/slack";
import { waitlistRouter } from "./routers/waitlist";

const app = new Hono<HonoEnv>()
  .use(
    cors({
      origin: [
        "https://app-v2.asyncstatus.com",
        "https://app-v2.dev.asyncstatus.com",
        "https://v2.asyncstatus.com",
        "https://asyncstatus.com",
        "https://v2.dev.asyncstatus.com",
      ],
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
      windowMs: 60 * 60 * 1000, // 60 minutes
      limit: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    });
    c.set("waitlistRateLimiter", waitlistRateLimiter);
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
  .route("/organization", organizationSlackRouter)
  .route("/invitation", invitationRouter)
  .route("/slack", slackRouter)
  .route("/waitlist", waitlistRouter)
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
