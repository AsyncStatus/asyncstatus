import type { updateUserOnboardingContract } from "@asyncstatus/api/typed-handlers/onboarding";
import type { QueryClient } from "@tanstack/react-query";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";

export function updateOnboardingOptimistic(
  queryClient: QueryClient,
  onboardingData: typeof updateUserOnboardingContract.$infer.input,
) {
  queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData: any) => {
    if (!sessionData) {
      return sessionData;
    }
    return {
      ...sessionData,
      user: {
        ...sessionData.user,
        showOnboarding: onboardingData.showOnboarding ?? sessionData.user.showOnboarding,
        onboardingStep: onboardingData.onboardingStep ?? sessionData.user.onboardingStep,
        onboardingCompletedAt:
          onboardingData.onboardingCompletedAt ?? sessionData.user.onboardingCompletedAt,
      },
    };
  });
}
