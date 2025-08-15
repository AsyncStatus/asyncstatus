import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { User, UserUpdate } from "../db";

export const updateUserOnboardingContract = typedContract(
  `patch /users/onboarding`,
  z.strictObject({
    showOnboarding: UserUpdate.shape.showOnboarding,
    onboardingStep: UserUpdate.shape.onboardingStep,
    onboardingCompletedAt: UserUpdate.shape.onboardingCompletedAt,
  }),
  User,
);
