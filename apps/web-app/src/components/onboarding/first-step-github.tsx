import { getGithubIntegrationContract } from "@asyncstatus/api/typed-handlers/github-integration";
import { onboardingSelectGithubRepositoriesContract } from "@asyncstatus/api/typed-handlers/onboarding";
import {
  generateStatusUpdateContract,
  getStatusUpdateContract,
} from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
import { SiGithub } from "@asyncstatus/ui/brand-icons";
import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
import { Button } from "@asyncstatus/ui/components/button";
import { ArrowRight, Loader2 } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { StatusUpdateCard, StatusUpdateCardSkeleton } from "../status-update-card";

export function FirstStepGithub({ organizationSlug }: { organizationSlug: string }) {
  const now = dayjs.utc();
  const nowStartOfWeek = now.startOf("week");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldPollForGithubIntegration, setShouldPollForGithubIntegration] = useState(true);
  const queryClient = useQueryClient();
  const statusUpdate = useQuery(
    typedQueryOptions(
      getStatusUpdateContract,
      {
        idOrSlug: organizationSlug,
        statusUpdateIdOrDate: nowStartOfWeek.format("YYYY-MM-DD"),
      },
      { throwOnError: false },
    ),
  );
  const generateStatusUpdate = useMutation(
    typedMutationOptions(generateStatusUpdateContract, {
      onSuccess(data) {
        queryClient.setQueryData(
          typedQueryOptions(getStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: nowStartOfWeek.format("YYYY-MM-DD"),
          }).queryKey,
          data,
        );
        queryClient.setQueryData(
          typedQueryOptions(getStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: data.id,
          }).queryKey,
          data,
        );
      },
    }),
  );
  const githubIntegration = useQuery(
    typedQueryOptions(getGithubIntegrationContract, { idOrSlug: organizationSlug }),
  );

  useEffect(() => {
    if (githubIntegration.data?.syncFinishedAt) {
      setShouldPollForGithubIntegration(false);
      return;
    }

    if (githubIntegration.data?.syncStartedAt || githubIntegration.data?.syncUpdatedAt) {
      setShouldPollForGithubIntegration(true);
      return;
    }
  }, [
    githubIntegration.data?.syncFinishedAt,
    githubIntegration.data?.syncStartedAt,
    githubIntegration.data?.syncUpdatedAt,
  ]);

  useEffect(() => {
    if (shouldPollForGithubIntegration) {
      timerRef.current = setInterval(() => {
        githubIntegration.refetch();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [shouldPollForGithubIntegration]);

  useEffect(() => {
    if (
      !githubIntegration.isPending &&
      githubIntegration.data?.syncFinishedAt &&
      !statusUpdate.isPending &&
      !statusUpdate.data &&
      !generateStatusUpdate.isPending
    ) {
      generateStatusUpdate.mutate({
        idOrSlug: organizationSlug,
        effectiveFrom: nowStartOfWeek.format("YYYY-MM-DD"),
        effectiveTo: now.format("YYYY-MM-DD"),
      });
      return;
    }
  }, [
    githubIntegration.data?.syncFinishedAt,
    statusUpdate.data,
    generateStatusUpdate.isPending,
    githubIntegration.isPending,
    statusUpdate.isPending,
  ]);

  function Title() {
    if (generateStatusUpdate.isPending) {
      return (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="size-6 animate-spin" />
          Generating status update...
        </div>
      );
    }

    if (
      (githubIntegration.data?.syncStartedAt || githubIntegration.data?.syncUpdatedAt) &&
      !githubIntegration.data?.syncFinishedAt
    ) {
      return (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="size-6 animate-spin" />
          Syncing your activity...
        </div>
      );
    }

    if (statusUpdate.data) {
      return "Here's what you got done this week";
    }

    return "Let's generate your first status update";
  }

  function Description() {
    if (generateStatusUpdate.isPending) {
      return "This usually takes 10-30 seconds.";
    }

    if (
      (githubIntegration.data?.syncStartedAt || githubIntegration.data?.syncUpdatedAt) &&
      !githubIntegration.data?.syncFinishedAt
    ) {
      return "This usually takes 10-30 seconds.";
    }

    if (statusUpdate.data) {
      return "We've summarized your activity for you.";
    }

    return "It takes less than a minute to get what you got done this week.";
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="text-2xl font-bold text-center text-pretty">
          <Title />
        </AlertDialogTitle>
        <AlertDialogDescription className="text-muted-foreground font-bold text-base text-pretty text-center">
          <Description />
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="flex flex-col gap-2 mt-12">
        {(!githubIntegration.data || !statusUpdate.data) && !generateStatusUpdate.isPending && (
          <Button asChild size="lg">
            <a
              href={typedUrl(onboardingSelectGithubRepositoriesContract, {
                idOrSlug: organizationSlug,
              })}
            >
              <SiGithub className="size-4" />
              Select GitHub repositories
            </a>
          </Button>
        )}

        {generateStatusUpdate.isPending && (
          <div className="w-full">
            <StatusUpdateCardSkeleton count={1} />
          </div>
        )}

        {statusUpdate.data && (
          <>
            <StatusUpdateCard
              organizationSlug={organizationSlug}
              statusUpdate={statusUpdate.data}
            />

            <Button className="mt-12">
              Next
              <ArrowRight className="size-4" />
            </Button>
          </>
        )}
      </div>
    </>
  );
}
