import { TypedHandlersError, typedHandler, typedMiddleware } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";

import * as schema from "../db";
import type { TypedHandlersContext } from "../lib/env";
import { joinWaitlistContract } from "./waitlist-contracts";

export const joinWaitlistHandler = typedHandler<TypedHandlersContext, typeof joinWaitlistContract>(
  joinWaitlistContract,
  typedMiddleware<TypedHandlersContext>(({ rateLimiter }, next) => rateLimiter.waitlist(next)),
  async ({ db, input }) => {
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, input.email),
    });
    if (existingUser) {
      return { ok: true };
    }
    const { firstName, lastName, email } = input;
    const [user] = await db
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
    if (!user) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to join waitlist",
      });
    }

    return { ok: true };
  },
);
