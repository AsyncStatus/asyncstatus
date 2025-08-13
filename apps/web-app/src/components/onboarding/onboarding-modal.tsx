import { getGithubIntegrationContract } from "@asyncstatus/api/typed-handlers/github-integration";
import { SiDiscord, SiSlack } from "@asyncstatus/ui/brand-icons";
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
import { FirstStepGithub } from "./first-step-github";
import { ManualUpdatesDialog } from "./manual-updates-dialog";

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

  return (
    <>
      <AlertDialog open={session.data?.user.showOnboarding} onOpenChange={() => {}}>
        <AlertDialogContentBlurredOverlay
          className={cn("p-12 pb-2 sm:max-w-2xl transition-all gap-0 ring-0 outline-none")}
        >
          <div className="flex flex-col gap-2">
            {session.data?.user.onboardingStep === "first-step" && (
              <FirstStepGithub organizationSlug={organizationSlug} />
            )}

            <div className="flex flex-col gap-2">
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
                    className="text-muted-foreground mt-12 text-xs"
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
