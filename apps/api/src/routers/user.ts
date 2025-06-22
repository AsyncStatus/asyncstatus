import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { generateId } from "better-auth";

import { AsyncStatusUnauthorizedError, AsyncStatusUnexpectedApiError } from "../errors";
import type { HonoEnvWithSession } from "../lib/env";
import * as schema from "../db/schema";
import { zUserProfileUpdate } from "../schema/user";

export const userRouter = new Hono<HonoEnvWithSession>()
  // Get current user profile
  .get("/me", async (c) => {
    const user = await c.var.db.query.user.findFirst({
      where: eq(schema.user.id, c.var.session.user.id),
    });

    if (!user) {
      throw new AsyncStatusUnauthorizedError({
        message: "User not found",
      });
    }

    return c.json(user);
  })
  // Update current user profile
  .patch("/me", zValidator("json", zUserProfileUpdate), async (c) => {
    const updates = c.req.valid("json");
    const userId = c.var.session.user.id;

    // Handle image upload if provided
    if (updates.image instanceof File) {
      const currentUser = await c.var.db.query.user.findFirst({
        where: eq(schema.user.id, userId),
      });

      // Delete old image if exists
      if (currentUser?.image) {
        await c.env.PRIVATE_BUCKET.delete(currentUser.image);
      }

      // Upload new image
      const image = await c.env.PRIVATE_BUCKET.put(
        generateId(),
        updates.image,
      );
      if (!image) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to upload image",
        });
      }
      (updates as any).image = image.key;
    } else if (updates.image === null) {
      // Delete image if set to null
      const currentUser = await c.var.db.query.user.findFirst({
        where: eq(schema.user.id, userId),
      });
      
      if (currentUser?.image) {
        await c.env.PRIVATE_BUCKET.delete(currentUser.image);
      }
      (updates as any).image = null;
    }

    // Update user profile
    const updatedUser = await c.var.db
      .update(schema.user)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId))
      .returning();

    if (!updatedUser || !updatedUser[0]) {
      throw new AsyncStatusUnexpectedApiError({
        message: "Failed to update user profile",
      });
    }

    return c.json(updatedUser[0]);
  })
  // Get list of supported timezones
  .get("/timezones", async (c) => {
    // Return a list of common timezones
    // In a real app, you might want to use a library like moment-timezone
    const timezones = [
      { value: "UTC", label: "UTC" },
      { value: "America/New_York", label: "Eastern Time (US & Canada)" },
      { value: "America/Chicago", label: "Central Time (US & Canada)" },
      { value: "America/Denver", label: "Mountain Time (US & Canada)" },
      { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
      { value: "America/Anchorage", label: "Alaska" },
      { value: "America/Honolulu", label: "Hawaii" },
      { value: "Europe/London", label: "London" },
      { value: "Europe/Paris", label: "Paris" },
      { value: "Europe/Berlin", label: "Berlin" },
      { value: "Europe/Moscow", label: "Moscow" },
      { value: "Asia/Dubai", label: "Dubai" },
      { value: "Asia/Kolkata", label: "Mumbai, Kolkata, New Delhi" },
      { value: "Asia/Shanghai", label: "Beijing, Shanghai" },
      { value: "Asia/Tokyo", label: "Tokyo" },
      { value: "Asia/Seoul", label: "Seoul" },
      { value: "Australia/Sydney", label: "Sydney" },
      { value: "Pacific/Auckland", label: "Auckland" },
    ];

    return c.json(timezones);
  });