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

export const onboardingSelectGithubRepositoriesContract = typedContract(
  `get /organizations/:idOrSlug/onboarding/select-github-repositories`,
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.instanceof(Response),
);
