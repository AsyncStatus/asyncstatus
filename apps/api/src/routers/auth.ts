import { Hono } from "hono";

import type { HonoEnv } from "../lib/env";

export const authRouter = new Hono<HonoEnv>()
  .get("/session", (c) => {
    const session = c.get("session");

    if (!session) return c.body(null, 401);

    return c.json(session);
  })
  .on(["POST", "GET"], "*", (c) => {
    return c.get("auth").handler(c.req.raw);
  });
