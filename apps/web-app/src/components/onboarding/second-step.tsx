import { updateUserOnboardingContract } from "@asyncstatus/api/typed-handlers/onboarding";
import { dayjs } from "@asyncstatus/dayjs";
import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
import { Button } from "@asyncstatus/ui/components/button";
import { ArrowLeft, ArrowRight } from "@asyncstatus/ui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { typedMutationOptions } from "@/typed-handlers";
import { updateOnboardingOptimistic } from "./update-onboarding-optimistic";

export function SecondStep() {
  const queryClient = useQueryClient();
  const updateUserOnboarding = useMutation(
    typedMutationOptions(updateUserOnboardingContract, {
      onMutate(variables) {
        if (variables instanceof FormData) {
          return;
        }

        updateOnboardingOptimistic(queryClient, {
          showOnboarding: variables.showOnboarding,
          onboardingStep: variables.onboardingStep,
          onboardingCompletedAt: variables.onboardingCompletedAt,
        });
      },
      onSettled() {
        queryClient.invalidateQueries(sessionBetterAuthQueryOptions());
      },
    }),
  );

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="text-2xl font-bold text-center text-pretty">
          Second step
        </AlertDialogTitle>
        <AlertDialogDescription className="text-muted-foreground font-bold text-base text-pretty text-center">
          Second step description
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="flex items-center justify-between gap-2 mt-12">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            updateUserOnboarding.mutate({
              showOnboarding: true,
              onboardingStep: "first-step",
              onboardingCompletedAt: null,
            });
          }}
        >
          <ArrowLeft className="size-4" />
          Your first status update
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            updateUserOnboarding.mutate({
              showOnboarding: false,
              onboardingStep: null,
              onboardingCompletedAt: dayjs.utc().toISOString(),
            });
          }}
        >
          Finish
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
