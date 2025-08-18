import { updateUserOnboardingContract } from "@asyncstatus/api/typed-handlers/onboarding";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContentBlurredOverlay,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { typedMutationOptions } from "@/typed-handlers";
import { updateOnboardingOptimistic } from "./update-onboarding-optimistic";

export function ManualUpdatesDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContentBlurredOverlay className="gap-0 p-12 sm:max-w-2xl">
        <AlertDialogHeader className="mb-4 ">
          <AlertDialogTitle className="text-3xl font-normal text-center text-pretty text-foreground/80">
            You can <span className="font-bold text-foreground">save hours per week</span> with
            automatic updates
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-pretty my-6 leading-relaxed">
            Manual updates are more time consuming. The data is already available in your GitHub,
            Slack, and Discord channels. We just aggregate and summarize it for you, so you can
            focus on your work, not status updates or daily standup meetings. <br /> <br /> We
            highly recommend using automatic updates especially if you have multiple repositories,
            channels, or teams.{" "}
            <span className="font-bold">It's free and takes less than a minute to setup.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 max-sm:flex-col">
          <AlertDialogCancel
            onClick={() => {
              updateUserOnboarding.mutate({
                showOnboarding: false,
                onboardingStep: null,
                onboardingCompletedAt: null,
              });
            }}
          >
            I have plenty of time, skip
          </AlertDialogCancel>
          <AlertDialogAction>I want to save time, connect integrations</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContentBlurredOverlay>
    </AlertDialog>
  );
}
