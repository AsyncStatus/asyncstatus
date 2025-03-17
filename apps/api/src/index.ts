import { Hono } from "hono";
import { cors } from "hono/cors";

import type { HonoEnv } from "@/lib/env";

import { createDb } from "./db";
import { createAuth } from "./lib/auth";
import { authRouter } from "./routers/auth";

const app = new Hono<HonoEnv>()
  .use(
    "*",
    cors({
      origin: "*",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    }),
  )
  .use("*", async (c, next) => {
    const db = createDb(c.env);
    c.set("db", db);
    const auth = createAuth(c.env, db);
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
  .route("/auth", authRouter)
  .get("/", (c) => {
    return c.text("Hello Hono!");
  });

export default app;
export type App = typeof app;
