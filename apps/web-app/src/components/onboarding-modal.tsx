import { getGithubIntegrationContract } from "@asyncstatus/api/typed-handlers/github-integration";
import {
  onboardingSelectGithubRepositoriesContract,
  updateUserOnboardingContract,
} from "@asyncstatus/api/typed-handlers/onboarding";
import {
  generateStatusUpdateContract,
  getStatusUpdateContract,
} from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
import { SiDiscord, SiGithub, SiSlack } from "@asyncstatus/ui/brand-icons";
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
import { Button } from "@asyncstatus/ui/components/button";
import { Loader2 } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { StatusUpdateCard } from "./status-update-card";

export function OnboardingModal({ organizationSlug }: { organizationSlug: string }) {
  const now = dayjs.utc();
  const nowStartOfWeek = now.startOf("week");
  const queryClient = useQueryClient();
  const session = useQuery(sessionBetterAuthQueryOptions());
  const [manualUpdatesDialogOpen, setManualUpdatesDialogOpen] = useState(false);
  const githubIntegration = useQuery(
    typedQueryOptions(getGithubIntegrationContract, { idOrSlug: organizationSlug }),
  );
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
      onSuccess(data, variables, context) {
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

  const hasGithubIntegration =
    githubIntegration.data?.syncFinishedAt ||
    githubIntegration.data?.syncStartedAt ||
    githubIntegration.data?.syncUpdatedAt;

  useEffect(() => {
    if (
      !statusUpdate.data?.id &&
      githubIntegration.data?.syncFinishedAt &&
      !statusUpdate.isPending &&
      !githubIntegration.isPending &&
      !generateStatusUpdate.isPending
    ) {
      generateStatusUpdate.mutate({
        idOrSlug: organizationSlug,
        effectiveFrom: nowStartOfWeek.toISOString(),
        effectiveTo: now.toISOString(),
      });
    }
  }, [
    statusUpdate.data?.id,
    githubIntegration.data?.syncFinishedAt,
    githubIntegration.isPending,
    generateStatusUpdate.isPending,
  ]);

  return (
    <>
      <AlertDialog open={session.data?.user.showOnboarding} onOpenChange={() => {}}>
        <AlertDialogContentBlurredOverlay
          className={cn("p-12 pb-2 sm:max-w-2xl transition-all", hasGithubIntegration && "pb-12")}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-center text-pretty">
              {statusUpdate.data
                ? "Here's what you got done this week"
                : "Let's generate your first status update"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold text-base text-pretty text-center">
              {statusUpdate.data
                ? "We've summarized your activity for you. You can edit it if you want."
                : "It takes less than a minute to connect your integrations."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4 mt-6">
            <div className="flex flex-col gap-2">
              {generateStatusUpdate.isPending && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Generating status update... (this usually takes 10-30 seconds)
                </div>
              )}

              {statusUpdate.data && (
                <StatusUpdateCard
                  organizationSlug={organizationSlug}
                  statusUpdate={statusUpdate.data}
                />
              )}

              {!generateStatusUpdate.isPending && !statusUpdate.data && (
                <GithubSection organizationSlug={organizationSlug} />
              )}

              {!hasGithubIntegration && (
                <>
                  <Button asChild size="lg" variant="outline">
                    <a
                      href={`https://slack.com/oauth/v2/authorize?state=${organizationSlug}&client_id=${import.meta.env.VITE_SLACK_INTEGRATION_APP_CLIENT_ID}&scope=app_mentions:read,channels:history,channels:join,channels:read,chat:write,chat:write.public,commands,emoji:read,files:read,groups:history,groups:read,im:history,im:read,incoming-webhook,mpim:history,mpim:read,pins:read,reactions:read,team:read,users:read,users.profile:read,users:read.email,calls:read,reminders:read,reminders:write,channels:manage,chat:write.customize,im:write,links:read,metadata.message:read,mpim:write,pins:write,reactions:write,dnd:read,usergroups:read,usergroups:write,users:write,remote_files:read,remote_files:write,files:write,groups:write&user_scope=channels:history,channels:read,dnd:read,emoji:read,files:read,groups:history,groups:read,im:history,im:read,mpim:history,mpim:read,pins:read,reactions:read,team:read,users:read,users.profile:read,users:read.email,calls:read,reminders:read,reminders:write,stars:read`}
                    >
                      <SiSlack className="size-4" />
                      Select Slack channels
                    </a>
                  </Button>

                  <Button asChild size="lg" variant="outline">
                    <a
                      href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_INTEGRATION_APP_CLIENT_ID}&permissions=8&scope=bot+identify+email+guilds+guilds.members.read+messages.read&response_type=code&redirect_uri=${encodeURIComponent(`${import.meta.env.VITE_API_URL}/integrations/discord/callback`)}&state=${organizationSlug}`}
                    >
                      <SiDiscord className="size-4" />
                      Select Discord channels
                    </a>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground mt-6 text-xs"
                    onClick={() => setManualUpdatesDialogOpen(true)}
                  >
                    I prefer manual updates
                  </Button>
                </>
              )}
            </div>
          </div>
        </AlertDialogContentBlurredOverlay>
      </AlertDialog>

      <ManualUpdatesDialog
        isOpen={manualUpdatesDialogOpen}
        onOpenChange={setManualUpdatesDialogOpen}
      />
    </>
  );
}

function GithubSection({ organizationSlug }: { organizationSlug: string }) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldPollForGithubIntegration, setShouldPollForGithubIntegration] = useState(true);
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

  if (githubIntegration.data?.syncFinishedAt) {
    return (
      <Button size="lg" disabled>
        <SiGithub className="size-4" />
        Synced
      </Button>
    );
  }

  if (githubIntegration.data?.syncStartedAt || githubIntegration.data?.syncUpdatedAt) {
    return (
      <Button size="lg" disabled>
        <SiGithub className="size-4" />
        Syncing your events...
      </Button>
    );
  }

  return (
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
  );
}

function ManualUpdatesDialog({
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

        queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData: any) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            user: {
              ...sessionData.user,
              showOnboarding: variables.showOnboarding ?? sessionData.user.showOnboarding,
              onboardingStep: variables.onboardingStep ?? sessionData.user.onboardingStep,
              onboardingCompletedAt:
                variables.onboardingCompletedAt ?? sessionData.user.onboardingCompletedAt,
            },
          };
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
          <AlertDialogTitle className="text-3xl font-normal text-center text-pretty text-primary-foreground/80">
            You can <span className="font-bold text-primary-foreground">save hours per week</span>{" "}
            with automatic updates
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
