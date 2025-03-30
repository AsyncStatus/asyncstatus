import { Hono } from "hono";

import { AsyncStatusUnauthorizedError } from "../errors";
import type { HonoEnv } from "../lib/env";

export const authRouter = new Hono<HonoEnv>()
  .get("/session", (c) => {
    const session = c.get("session");

    if (!session) {
      throw new AsyncStatusUnauthorizedError({
        message: "Unauthorized",
      });
    }

    return c.json(session);
  })
  .on(["POST", "GET"], "*", (c) => {
    return c.get("auth").handler(c.req.raw);
  });
