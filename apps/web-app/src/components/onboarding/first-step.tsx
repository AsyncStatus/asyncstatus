import {
  discordIntegrationCallbackContract,
  getDiscordIntegrationContract,
} from "@asyncstatus/api/typed-handlers/discord-integration";
import {
  getGithubIntegrationContract,
  githubIntegrationCallbackContract,
} from "@asyncstatus/api/typed-handlers/github-integration";
import {
  createOnboardingRecommendedAutomationsContract,
  updateUserOnboardingContract,
} from "@asyncstatus/api/typed-handlers/onboarding";
import { listSchedulesContract } from "@asyncstatus/api/typed-handlers/schedule";
import {
  getSlackIntegrationContract,
  slackIntegrationCallbackContract,
} from "@asyncstatus/api/typed-handlers/slack-integration";
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
import { Button } from "@asyncstatus/ui/components/button";
import { ArrowRight, Loader2 } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  linkSocialMutationOptions,
  sessionBetterAuthQueryOptions,
} from "@/better-auth-tanstack-query";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { StatusUpdateCard, StatusUpdateCardSkeleton } from "../status-update-card";
import { StepSkeleton } from "./step-skeleton";
import { updateOnboardingOptimistic } from "./update-onboarding-optimistic";

export function FirstStep({ organizationSlug }: { organizationSlug: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const search = useSearch({ from: "/$organizationSlug" });
  const now = useMemo(() => dayjs.utc(), []);
  const nowEndOfDay = useMemo(() => now.endOf("day"), [now]);
  const nowStartOfWeek = useMemo(() => now.startOf("week").startOf("day"), [now]);
  const queryClient = useQueryClient();
  const statusUpdate = useQuery(
    typedQueryOptions(
      getStatusUpdateContract,
      { idOrSlug: organizationSlug, statusUpdateIdOrDate: nowStartOfWeek.format("YYYY-MM-DD") },
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
  const linkSocial = useMutation({
    ...linkSocialMutationOptions(),
    async onSuccess() {
      await queryClient.resetQueries();
      await router.invalidate();
      await navigate({ to: search.redirect ?? "/" });
    },
  });
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
            query.state.data?.syncUpdatedAt &&
            !query.state.data?.syncFinishedAt &&
            !query.state.data?.syncError
          ) {
            return 500;
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
            query.state.data?.syncUpdatedAt &&
            !query.state.data?.syncFinishedAt &&
            !query.state.data?.syncError
          ) {
            return 500;
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
            query.state.data?.syncUpdatedAt &&
            !query.state.data?.syncFinishedAt &&
            !query.state.data?.syncError
          ) {
            return 500;
          }

          return false;
        },
      },
    ),
  );
  const createRecommendedAutomations = useMutation(
    typedMutationOptions(createOnboardingRecommendedAutomationsContract, {
      onSuccess(data) {
        queryClient.setQueryData(
          typedQueryOptions(listSchedulesContract, {
            idOrSlug: organizationSlug,
          }).queryKey,
          data,
        );
      },
    }),
  );
  const hasGithubIntegration = githubIntegration.data?.syncFinishedAt;
  const hasSlackIntegration = slackIntegration.data?.syncFinishedAt;
  const hasDiscordIntegration = discordIntegration.data?.syncFinishedAt;
  const connectedIntegrationsCount = useMemo(() => {
    let count = 0;
    if (hasGithubIntegration) count++;
    if (hasSlackIntegration) count++;
    if (hasDiscordIntegration) count++;
    return count;
  }, [hasGithubIntegration, hasSlackIntegration, hasDiscordIntegration]);

  // Persist last finished timestamps per org to detect transitions across page navigations
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      githubIntegration.isPending ||
      slackIntegration.isPending ||
      discordIntegration.isPending
    ) {
      return;
    }

    const storageKey = `onboarding:integrationFinishedAt:${organizationSlug}`;
    type Snapshot = { github: string | null; slack: string | null; discord: string | null };
    let prev: Snapshot | null = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      prev = raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {}

    const current: Snapshot = {
      github: githubIntegration.data?.syncFinishedAt
        ? String(githubIntegration.data.syncFinishedAt)
        : null,
      slack: slackIntegration.data?.syncFinishedAt
        ? String(slackIntegration.data.syncFinishedAt)
        : null,
      discord: discordIntegration.data?.syncFinishedAt
        ? String(discordIntegration.data.syncFinishedAt)
        : null,
    };

    const transitioned =
      !!prev &&
      ((prev.github !== current.github && !!current.github) ||
        (prev.slack !== current.slack && !!current.slack) ||
        (prev.discord !== current.discord && !!current.discord));

    if (transitioned && !generateStatusUpdate.isPending) {
      generateStatusUpdate.mutate({
        idOrSlug: organizationSlug,
        effectiveFrom: nowStartOfWeek.toISOString(),
        effectiveTo: nowEndOfDay.toISOString(),
      });
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(current));
    } catch {}
  }, [
    organizationSlug,
    githubIntegration.isPending,
    slackIntegration.isPending,
    discordIntegration.isPending,
    githubIntegration.data?.syncFinishedAt,
    slackIntegration.data?.syncFinishedAt,
    discordIntegration.data?.syncFinishedAt,
    nowStartOfWeek,
    nowEndOfDay,
    generateStatusUpdate.isPending,
  ]);

  useEffect(() => {
    if (
      connectedIntegrationsCount > 0 &&
      !statusUpdate.isPending &&
      !generateStatusUpdate.isPending &&
      !statusUpdate.data
    ) {
      generateStatusUpdate.mutate({
        idOrSlug: organizationSlug,
        effectiveFrom: nowStartOfWeek.toISOString(),
        effectiveTo: nowEndOfDay.toISOString(),
      });
      return;
    }
  }, [
    connectedIntegrationsCount,
    statusUpdate.data,
    generateStatusUpdate.isPending,
    statusUpdate.isPending,
    statusUpdate.data,
    nowStartOfWeek,
    nowEndOfDay,
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

        {statusUpdate.data && !generateStatusUpdate.isPending && (
          <StatusUpdateCard organizationSlug={organizationSlug} statusUpdate={statusUpdate.data} />
        )}

        {!generateStatusUpdate.isPending && (
          <Button
            variant="outline"
            size="lg"
            disabled={Boolean(githubIntegration.data || githubIntegration.isPending)}
            onClick={() =>
              linkSocial.mutate({
                provider: "github",
                scopes: ["user:email"],
                callbackURL: typedUrl(githubIntegrationCallbackContract, {}),
              })
            }
          >
            <div
              className={cn("size-2 rounded-full", githubIntegration.data && "bg-green-500")}
            ></div>
            <SiGithub className="size-4" />
            {githubIntegration.data ? "Using context from GitHub" : "Add context from GitHub"}
          </Button>
        )}

        {!generateStatusUpdate.isPending && (
          <Button
            variant="outline"
            size="lg"
            disabled={Boolean(slackIntegration.data || slackIntegration.isPending)}
            onClick={() =>
              linkSocial.mutate({
                provider: "slack",
                callbackURL: typedUrl(slackIntegrationCallbackContract, {}),
              })
            }
          >
            <div
              className={cn("size-2 rounded-full", slackIntegration.data && "bg-green-500")}
            ></div>
            <SiSlack className="size-4" />
            {slackIntegration.data ? "Using context from Slack" : "Add context from Slack"}
          </Button>
        )}

        {!generateStatusUpdate.isPending && (
          <Button
            variant="outline"
            size="lg"
            disabled={Boolean(discordIntegration.data || discordIntegration.isPending)}
            onClick={() =>
              linkSocial.mutate({
                provider: "discord",
                callbackURL: typedUrl(discordIntegrationCallbackContract, {}),
              })
            }
          >
            <div
              className={cn("size-2 rounded-full", discordIntegration.data && "bg-green-500")}
            ></div>
            <SiDiscord className="size-4" />
            {discordIntegration.data ? "Using context from Discord" : "Add context from Discord"}
          </Button>
        )}

        {statusUpdate.data && connectedIntegrationsCount > 0 && !generateStatusUpdate.isPending && (
          <Button
            className="mt-12"
            onClick={() => {
              updateUserOnboarding.mutate({
                showOnboarding: true,
                onboardingStep: "second-step",
                onboardingCompletedAt: null,
              });
              createRecommendedAutomations.mutate({
                idOrSlug: organizationSlug,
              });
            }}
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
