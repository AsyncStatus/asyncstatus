import { Member, Schedule, User, UserUpdate } from "@asyncstatus/db";
import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const updateUserOnboardingContract = typedContract(
  `patch /users/onboarding`,
  z.strictObject({
    showOnboarding: UserUpdate.shape.showOnboarding,
    onboardingStep: UserUpdate.shape.onboardingStep,
    onboardingCompletedAt: UserUpdate.shape.onboardingCompletedAt,
  }),
  User,
);

export const createOnboardingRecommendedAutomationsContract = typedContract(
  "post /organizations/:idOrSlug/onboarding/recommended-automations",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.array(
    z.strictObject({
      ...Schedule.shape,
      createdByMember: z.strictObject({ ...Member.shape, user: User }).nullable(),
    }),
  ),
);
