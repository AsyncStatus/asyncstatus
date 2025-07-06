import { typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";

import * as schema from "../db";
import type { TypedHandlersContext } from "../lib/env";
import { joinWaitlistContract } from "./waitlist-contracts";

export const joinWaitlistHandler = typedHandler<TypedHandlersContext, typeof joinWaitlistContract>(
  joinWaitlistContract,
  async ({ db, input }) => {
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, input.email),
    });
    if (existingUser) {
      return { ok: true };
    }
    const { firstName, lastName, email } = input;
    await db.insert(schema.user).values({
      id: generateId(),
      name: `${firstName} ${lastName}`,
      email,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { ok: true };
  },
);
