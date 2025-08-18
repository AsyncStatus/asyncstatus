import { updateUserOnboardingContract } from "@asyncstatus/api/typed-handlers/onboarding";
import { listSchedulesContract } from "@asyncstatus/api/typed-handlers/schedule";
import { getStatusUpdateContract } from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
import { Button } from "@asyncstatus/ui/components/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { SchedulePrettyDescription } from "../schedule-pretty-description";
import { StatusUpdateCard, StatusUpdateCardSkeleton } from "../status-update-card";
import { StepSkeleton } from "./step-skeleton";
import { updateOnboardingOptimistic } from "./update-onboarding-optimistic";

export function ThirdStep({ organizationSlug }: { organizationSlug: string }) {
  const now = dayjs.utc();
  const nowStartOfWeek = now.startOf("week").startOf("day");
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

  const statusUpdate = useQuery(
    typedQueryOptions(
      getStatusUpdateContract,
      { idOrSlug: organizationSlug, statusUpdateIdOrDate: nowStartOfWeek.format("YYYY-MM-DD") },
      { throwOnError: false },
    ),
  );

  const schedules = useQuery(
    typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug }),
  );

  if (statusUpdate.isPending || schedules.isPending) {
    return <StepSkeleton />;
  }

  const hasGenerateUpdates = Boolean(schedules.data?.some((s) => s.name === "generateUpdates"));
  const hasSendSummaries = Boolean(schedules.data?.some((s) => s.name === "sendSummaries"));
  const estimatedHoursSaved = hasGenerateUpdates && hasSendSummaries ? 2 : 1;

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="text-2xl font-bold text-center text-pretty">
          You're all set
        </AlertDialogTitle>
        <AlertDialogDescription className="text-muted-foreground font-bold text-base text-pretty text-center">
          Here's a quick recap of what we set up for you.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="flex flex-col gap-6 mt-8 overflow-y-auto max-h-[calc(100vh-300px)]">
        <section className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground/70 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-500" />
            Your first status update
          </h3>
          {!statusUpdate.data ? (
            <div className="w-full">
              <StatusUpdateCardSkeleton count={1} />
            </div>
          ) : (
            <StatusUpdateCard
              organizationSlug={organizationSlug}
              statusUpdate={statusUpdate.data}
            />
          )}
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground/70 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-500" />
            Recommended automations
          </h3>
          <div className="flex flex-col gap-2">
            {schedules.data?.length ? (
              schedules.data.map((schedule) => (
                <div key={schedule.id} className="border rounded-lg p-4">
                  <SchedulePrettyDescription
                    organizationSlug={organizationSlug}
                    schedule={schedule}
                  />
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No automations found yet.</div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground/70">
            What this unlocks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="border rounded-lg p-4 h-full">
              <div className="font-semibold mb-1 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                Automatic updates
              </div>
              <p className="text-sm text-muted-foreground">
                We capture your GitHub, Slack, and Discord activity and turn it into clear updates.
              </p>
            </div>
            <div className="border rounded-lg p-4 h-full">
              <div className="font-semibold mb-1 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                Weekly team summaries
              </div>
              <p className="text-sm text-muted-foreground">
                Clean, readable summaries delivered automatically to your team.
              </p>
            </div>
            <div className="border rounded-lg p-4 h-full">
              <div className="font-semibold mb-1 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                No more manual check-ins
              </div>
              <p className="text-sm text-muted-foreground">
                Focus on your work. Updates run in the background.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground/70">
            By the numbers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground uppercase">
                Estimated weekly time saved
              </div>
              <div className="text-2xl font-bold">{estimatedHoursSaved}h+</div>
              <div className="text-xs text-muted-foreground">per person</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground uppercase">Automations active</div>
              <div className="text-2xl font-bold">{schedules.data?.length ?? 0}</div>
              <div className="text-xs text-muted-foreground">ready and running</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground uppercase">What to expect</div>
              <div className="text-sm font-medium">Less meetings, fewer manual updates</div>
              <div className="text-xs text-muted-foreground">clear summaries, every week</div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between gap-2 mt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            updateUserOnboarding.mutate({
              showOnboarding: true,
              onboardingStep: "second-step",
              onboardingCompletedAt: null,
            });
          }}
        >
          <ArrowLeft className="size-4" />
          Your automations
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
