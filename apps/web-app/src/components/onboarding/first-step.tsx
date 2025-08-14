import { getDiscordIntegrationContract } from "@asyncstatus/api/typed-handlers/discord-integration";
import {
  getGithubIntegrationContract,
  githubIntegrationCallbackContract,
} from "@asyncstatus/api/typed-handlers/github-integration";
import { updateUserOnboardingContract } from "@asyncstatus/api/typed-handlers/onboarding";
import { getSlackIntegrationContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import {
  generateStatusUpdateContract,
  getStatusUpdateContract,
} from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
import { SiDiscord, SiGithub, SiSlack } from "@asyncstatus/ui/brand-icons";
import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
import { Badge } from "@asyncstatus/ui/components/badge";
import { Button } from "@asyncstatus/ui/components/button";
import { ArrowRight, Loader2 } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { StatusUpdateCard, StatusUpdateCardSkeleton } from "../status-update-card";
import { StepSkeleton } from "./step-skeleton";
import { updateOnboardingOptimistic } from "./update-onboarding-optimistic";

export function FirstStep({ organizationSlug }: { organizationSlug: string }) {
  const now = dayjs.utc();
  const nowStartOfWeek = now.startOf("week").startOf("day");
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
    typedQueryOptions(
      getGithubIntegrationContract,
      { idOrSlug: organizationSlug },
      {
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval(query) {
          if (
            query.state.data?.syncStartedAt &&
            !query.state.data?.syncFinishedAt &&
            !query.state.data?.syncError
          ) {
            return 1000;
          }

          return false;
        },
      },
    ),
  );
  const slackIntegration = useQuery(
    typedQueryOptions(
      getSlackIntegrationContract,
      { idOrSlug: organizationSlug },
      {
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval(query) {
          if (
            query.state.data?.syncStartedAt &&
            !query.state.data?.syncFinishedAt &&
            !query.state.data?.syncError
          ) {
            return 1000;
          }

          return false;
        },
      },
    ),
  );
  const discordIntegration = useQuery(
    typedQueryOptions(
      getDiscordIntegrationContract,
      { idOrSlug: organizationSlug },
      {
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval(query) {
          if (
            query.state.data?.syncStartedAt &&
            !query.state.data?.syncFinishedAt &&
            !query.state.data?.syncError
          ) {
            return 1000;
          }

          return false;
        },
      },
    ),
  );
  const hasGithubIntegration =
    !githubIntegration.isPending && githubIntegration.data?.syncFinishedAt;
  const hasSlackIntegration = !slackIntegration.isPending && slackIntegration.data?.syncFinishedAt;
  const hasDiscordIntegration =
    !discordIntegration.isPending && discordIntegration.data?.syncFinishedAt;
  const hasAnyIntegration = hasGithubIntegration || hasSlackIntegration || hasDiscordIntegration;

  useEffect(() => {
    if (
      hasAnyIntegration &&
      !statusUpdate.isPending &&
      !statusUpdate.data &&
      !generateStatusUpdate.isPending
    ) {
      generateStatusUpdate.mutate({
        idOrSlug: organizationSlug,
        effectiveFrom: nowStartOfWeek.format("YYYY-MM-DD"),
        effectiveTo: now.endOf("day").format("YYYY-MM-DD"),
      });
      return;
    }
  }, [
    hasAnyIntegration,
    statusUpdate.data,
    generateStatusUpdate.isPending,
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
      return `Here's what you got done this week`;
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
      return "This usually takes 5-20 seconds.";
    }

    if (statusUpdate.data) {
      const basedOnText = [
        hasGithubIntegration ? "GitHub" : "",
        hasSlackIntegration ? "Slack" : "",
        hasDiscordIntegration ? "Discord" : "",
      ].filter(Boolean);
      return (
        <p>We've summarized a week of your {formatter.format(basedOnText)} activity for you.</p>
      );
    }

    return "It takes less than a minute to get what you got done this week.";
  }

  if (
    statusUpdate.isPending ||
    githubIntegration.isPending ||
    slackIntegration.isPending ||
    discordIntegration.isPending
  ) {
    return <StepSkeleton />;
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
        {generateStatusUpdate.isPending && (
          <div className="w-full">
            <StatusUpdateCardSkeleton count={1} />
          </div>
        )}

        {statusUpdate.data && (
          <StatusUpdateCard organizationSlug={organizationSlug} statusUpdate={statusUpdate.data} />
        )}

        {!githubIntegration.data && !statusUpdate.data && !generateStatusUpdate.isPending && (
          <Button asChild size="lg">
            <a href={typedUrl(githubIntegrationCallbackContract, {})}>
              <SiGithub className="size-4" />
              Select GitHub repositories
            </a>
          </Button>
        )}

        {!slackIntegration.data && !statusUpdate.data && !generateStatusUpdate.isPending && (
          <Button asChild size="lg">
            <a href="/#">
              <SiSlack className="size-4" />
              Select Slack channels
            </a>
          </Button>
        )}

        {!discordIntegration.data && !statusUpdate.data && !generateStatusUpdate.isPending && (
          <Button asChild size="lg">
            <a href="/#">
              <SiDiscord className="size-4" />
              Select Discord channels
            </a>
          </Button>
        )}

        {statusUpdate.data && (
          <Button
            className="mt-12"
            onClick={() =>
              updateUserOnboarding.mutate({
                showOnboarding: true,
                onboardingStep: "second-step",
                onboardingCompletedAt: null,
              })
            }
          >
            Your automations
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </>
  );
}

const formatter = new Intl.ListFormat("en", { style: "long", type: "conjunction" });
