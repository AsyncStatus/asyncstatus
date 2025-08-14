import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { eq } from "drizzle-orm";
import * as schema from "../db";
import type { Session } from "../lib/auth";
import type { TypedHandlersContextWithSession } from "../lib/env";
import { requiredSession } from "./middleware";
import { updateUserOnboardingContract } from "./onboarding-contracts";

export const updateUserOnboardingHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof updateUserOnboardingContract
>(updateUserOnboardingContract, requiredSession, async ({ db, session, input, authKv }) => {
  const updates: Partial<typeof updateUserOnboardingContract.$infer.input> = {};

  if (input.showOnboarding !== undefined) {
    updates.showOnboarding = input.showOnboarding;
  }

  if (input.onboardingStep !== undefined) {
    updates.onboardingStep = input.onboardingStep;
  }

  if (input.onboardingCompletedAt !== undefined) {
    updates.onboardingCompletedAt = input.onboardingCompletedAt;
  }

  await db
    .update(schema.user)
    .set(updates as any)
    .where(eq(schema.user.id, session.user.id));

  const data = await authKv.get<Session>(session.session.token, {
    type: "json",
  });
  if (!data) {
    throw new TypedHandlersError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }
  await authKv.put(
    session.session.token,
    JSON.stringify({ ...data, user: { ...data.user, ...updates } }),
  );

  const user = await db.query.user.findFirst({ where: eq(schema.user.id, session.user.id) });
  if (!user) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return user;
});
