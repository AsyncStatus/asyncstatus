import { Hono } from "hono";
import { cors } from "hono/cors";
import { Resend } from "resend";

import { createDb } from "./db";
import { createAuth } from "./lib/auth";
import type { HonoEnv } from "./lib/env";
import { authRouter } from "./routers/auth";

const app = new Hono<HonoEnv>()
  .use("*", cors({ origin: (origin) => origin, credentials: true }))
  .use("*", async (c, next) => {
    const db = createDb(c.env);
    c.set("db", db);
    const resend = new Resend(c.env.RESEND_API_KEY);
    c.set("resend", resend);
    const auth = createAuth(c.env, db, resend);
    c.set("auth", auth);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return next();
  })
  .route("/auth", authRouter);

export default app;
export type App = typeof app;
