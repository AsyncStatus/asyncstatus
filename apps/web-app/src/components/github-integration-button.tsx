import { useState } from "react";
import { sessionQueryOptions } from "@/rpc/auth";
import {
  connectGithubMutationOptions,
  disconnectGithubMutationOptions,
  getGithubIntegrationQueryOptions,
} from "@/rpc/organization/github";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@asyncstatus/ui/components/dialog";
import { toast } from "@asyncstatus/ui/components/sonner";
import { Github } from "@asyncstatus/ui/icons";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

type GitHubIntegrationButtonProps = {
  organizationSlug: string;
};

export function GitHubIntegrationButton({
  organizationSlug,
}: GitHubIntegrationButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get session data to get organization ID
  const session = useSuspenseQuery(sessionQueryOptions());
  const { data: organizationData } = useSuspenseQuery(
    getGithubIntegrationQueryOptions(organizationSlug),
  );

  // Get current organization ID from session
  const organizationId = session.data?.session?.activeOrganizationId;

  // Fetch the current GitHub integration status
  const { data: githubIntegration } = useSuspenseQuery(
    getGithubIntegrationQueryOptions(organizationSlug),
  );

  // GitHub OAuth Installation URL - backend will handle the callback
  // We use state parameter to pass the organization ID
  const githubAppInstallUrl = `https://github.com/apps/asyncstatus/installations/new?state=${organizationId}`;

  // Disconnect GitHub mutation
  const disconnectGithub = useMutation({
    ...disconnectGithubMutationOptions(),
    onSuccess: () => {
      toast.success("Successfully disconnected GitHub");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: getGithubIntegrationQueryOptions(organizationSlug).queryKey,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to disconnect GitHub. Please try again.",
      );
    },
  });

  return (
    <>
      {!githubIntegration ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
        >
          Connect
        </Button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          onClick={() =>
            disconnectGithub.mutate({ param: { idOrSlug: organizationSlug } })
          }
          disabled={disconnectGithub.isPending}
        >
          Disconnect
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect GitHub</DialogTitle>
            <DialogDescription>
              Connect your GitHub organization to enable integration with your
              AsyncStatus organization.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 py-4">
            <p className="text-sm text-gray-500">
              After connecting, you'll be able to access information about your
              repositories, pull requests, and more.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!organizationId) {
                  toast.error("Unable to determine organization ID");
                  return;
                }
                window.location.href = githubAppInstallUrl;
              }}
            >
              <Github className="mr-2 h-4 w-4" />
              Install GitHub App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
