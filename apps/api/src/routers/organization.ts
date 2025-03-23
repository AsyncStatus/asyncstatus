import { zValidator } from "@hono/zod-validator";
import { eq, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { organization } from "../db/schema";
import type { HonoEnv } from "../lib/env";
import { requiredSession } from "../lib/middleware";

export const organizationRouter = new Hono<HonoEnv>()
  .use(requiredSession)
  .get(
    "/:idOrSlug",
    zValidator("param", z.object({ idOrSlug: z.string() })),
    async (c) => {
      const { idOrSlug } = c.req.valid("param");

      const org = await c.var.db
        .select()
        .from(organization)
        .where(
          or(eq(organization.id, idOrSlug), eq(organization.slug, idOrSlug)),
        )
        .limit(1);

      if (!org || !org[0]) {
        return c.json(null, 404);
      }

      return c.json(org[0]);
    },
  );
