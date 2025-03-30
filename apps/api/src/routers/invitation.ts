import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import * as schema from "../db/schema";
import { AsyncStatusNotFoundError } from "../errors";
import type { HonoEnv } from "../lib/env";

export const invitationRouter = new Hono<HonoEnv>().get(
  "/:id",
  zValidator("param", z.object({ id: z.string() })),
  zValidator("query", z.object({ email: z.string().email() })),
  async (c) => {
    const { id } = c.req.valid("param");
    const { email } = c.req.valid("query");
    const [invitation, user] = await Promise.all([
      c.var.db.query.invitation.findFirst({
        where: and(
          eq(schema.invitation.id, id),
          eq(schema.invitation.email, email),
        ),
        with: {
          inviter: { columns: { name: true } },
          organization: { columns: { name: true, slug: true, logo: true } },
        },
      }),
      c.var.db.query.user.findFirst({
        where: eq(schema.user.email, email),
      }),
    ]);
    if (
      !invitation ||
      (c.var.session && c.var.session.user.email !== invitation.email)
    ) {
      throw new AsyncStatusNotFoundError({
        message: "Invitation not found",
      });
    }
    const data = { ...invitation, hasUser: Boolean(user) };
    return c.json(data);
  },
);
