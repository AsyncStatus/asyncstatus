import { zValidator } from "@hono/zod-validator";
import { generateId, z } from "better-auth";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import * as schema from "../db/schema";
import { AsyncStatusUnexpectedApiError } from "../errors";
import type { HonoEnv } from "../lib/env";
import { zCreateWaitlistUser } from "../schema/waitlist";

export const waitlistRouter = new Hono<HonoEnv>().post(
  "/",
  zValidator("json", zCreateWaitlistUser),
  async (c, next) => {
    return c.var.waitlistRateLimiter(c, next);
  },
  async (c) => {
    const { firstName, lastName, email } = c.req.valid("json");
    const existingUser = await c.var.db.query.user.findFirst({
      where: eq(schema.user.email, email),
    });
    if (existingUser) {
      return c.json({ ok: true });
    }
    const [waitlist] = await c.var.db
      .insert(schema.user)
      .values({
        id: generateId(),
        name: `${firstName} ${lastName}`,
        email,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    if (!waitlist) {
      throw new AsyncStatusUnexpectedApiError({
        message: "Failed to join waitlist",
      });
    }
    return c.json({ ok: true });
  },
);
