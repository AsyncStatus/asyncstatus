import { createMiddleware } from "hono/factory";

import type { HonoEnv } from "./env";

export const requiredSession = createMiddleware<HonoEnv>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.body(null, 401);
  }

  const session = c.get("session");
  if (!session) {
    return c.body(null, 401);
  }
  await next();
});
