import { updateUserOnboardingContract } from "@asyncstatus/api/typed-handlers/onboarding";
import { listSchedulesContract } from "@asyncstatus/api/typed-handlers/schedule";
import { dayjs } from "@asyncstatus/dayjs";
import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
import { Button } from "@asyncstatus/ui/components/button";
import { ArrowLeft, ArrowRight } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { SchedulePrettyDescription } from "../schedule-pretty-description";
import { StepSkeleton } from "./step-skeleton";
import { updateOnboardingOptimistic } from "./update-onboarding-optimistic";

export function SecondStep({ organizationSlug }: { organizationSlug: string }) {
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
  const schedules = useQuery(
    typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug }),
  );

  if (schedules.isPending) {
    return <StepSkeleton />;
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="text-2xl font-bold text-center text-pretty">
          We've set up recommended automations for you
        </AlertDialogTitle>
        <AlertDialogDescription className="text-muted-foreground font-bold text-base text-pretty text-center">
          You don't have to join another 9:30am meeting ever again.
          <br />
          You can always edit automations or add new ones later.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="flex flex-col gap-2 mt-8">
        {schedules.data?.map((schedule) => (
          <div key={schedule.id} className="border rounded-lg p-4">
            <SchedulePrettyDescription organizationSlug={organizationSlug} schedule={schedule} />
          </div>
        ))}
      </div>

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
