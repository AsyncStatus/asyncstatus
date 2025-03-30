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
import { authRouter } from "./routers/auth";
import { invitationRouter } from "./routers/invitation";
import { organizationRouter } from "./routers/organization";

const app = new Hono<HonoEnv>()
  .use(
    cors({
      origin: [
        "http://localhost:3000",
        "https://app.asyncstatus.com",
        "https://app.dev.asyncstatus.com",
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
  .route("/invitation", invitationRouter)
  .onError((err, c) => {
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
