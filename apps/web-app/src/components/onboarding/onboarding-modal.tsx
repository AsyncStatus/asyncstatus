import { getDiscordIntegrationContract } from "@asyncstatus/api/typed-handlers/discord-integration";
import { getGithubIntegrationContract } from "@asyncstatus/api/typed-handlers/github-integration";
import { getSlackIntegrationContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import {
  AlertDialog,
  AlertDialogContentBlurredOverlay,
} from "@asyncstatus/ui/components/alert-dialog";
import { Button } from "@asyncstatus/ui/components/button";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { typedQueryOptions } from "@/typed-handlers";
import { FirstStep } from "./first-step";
import { ManualUpdatesDialog } from "./manual-updates-dialog";
import { SecondStep } from "./second-step";
import { ThirdStep } from "./third-step";

export function OnboardingModal({ organizationSlug }: { organizationSlug: string }) {
  const session = useQuery(sessionBetterAuthQueryOptions());
  const [manualUpdatesDialogOpen, setManualUpdatesDialogOpen] = useState(false);
  const githubIntegration = useQuery(
    typedQueryOptions(getGithubIntegrationContract, { idOrSlug: organizationSlug }),
  );
  const hasGithubIntegration =
    githubIntegration.data?.syncFinishedAt ||
    githubIntegration.data?.syncStartedAt ||
    githubIntegration.data?.syncUpdatedAt;
  const slackIntegration = useQuery(
    typedQueryOptions(getSlackIntegrationContract, { idOrSlug: organizationSlug }),
  );
  const hasSlackIntegration =
    slackIntegration.data?.syncFinishedAt ||
    slackIntegration.data?.syncStartedAt ||
    slackIntegration.data?.syncUpdatedAt;
  const discordIntegration = useQuery(
    typedQueryOptions(getDiscordIntegrationContract, { idOrSlug: organizationSlug }),
  );
  const hasDiscordIntegration =
    discordIntegration.data?.syncFinishedAt ||
    discordIntegration.data?.syncStartedAt ||
    discordIntegration.data?.syncUpdatedAt;

  return (
    <>
      <AlertDialog open={session.data?.user.showOnboarding} onOpenChange={() => {}}>
        <AlertDialogContentBlurredOverlay
          className={cn("p-12 pb-2 sm:max-w-2xl transition-all gap-0 ring-0 outline-none")}
        >
          <div className="flex flex-col gap-2">
            {session.data?.user.onboardingStep === "first-step" && (
              <FirstStep organizationSlug={organizationSlug} />
            )}

            {session.data?.user.onboardingStep === "second-step" && (
              <SecondStep organizationSlug={organizationSlug} />
            )}

            {session.data?.user.onboardingStep === "third-step" && (
              <ThirdStep organizationSlug={organizationSlug} />
            )}

            <div className="flex flex-col gap-2">
              {!hasGithubIntegration && !hasSlackIntegration && !hasDiscordIntegration && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground mt-12 text-xs"
                  onClick={() => setManualUpdatesDialogOpen(true)}
                >
                  I prefer manual updates
                </Button>
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
