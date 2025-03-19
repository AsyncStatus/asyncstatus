import type { HonoEnv } from "@asyncstatus/api/lib/env";
import { Hono } from "hono";

export const authRouter = new Hono<HonoEnv>()
  .get("/session", (c) => {
    const session = c.get("session");
    const user = c.get("user");

    if (!user) return c.body(null, 401);

    return c.json({ session, user });
  })
  .on(["POST", "GET"], "*", (c) => {
    return c.get("auth").handler(c.req.raw);
  });
