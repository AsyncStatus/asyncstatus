import { useEffect, useState } from "react";
import {
  disconnectGithubMutationOptions,
  getGithubIntegrationQueryOptions,
} from "@/rpc/organization/github";
import { rpc } from "@/rpc/rpc";
import {
  SyncGithubWorkflowStatusName,
  SyncGithubWorkflowStatusStep,
} from "@asyncstatus/api/schema/github-integration";
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

type GitHubIntegrationButtonProps = {
  organizationSlug: string;
};

export function GitHubIntegrationButton({
  organizationSlug,
}: GitHubIntegrationButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const githubIntegration = useSuspenseQuery(
    getGithubIntegrationQueryOptions(organizationSlug),
  );
  const githubAppInstallUrl = `https://github.com/apps/asyncstatus-local/installations/new?state=${organizationSlug}`;
  const disconnectGithub = useMutation({
    ...disconnectGithubMutationOptions(),
    onSuccess: () => {
      toast.success("Successfully disconnected GitHub");
      queryClient.invalidateQueries({
        queryKey: getGithubIntegrationQueryOptions(organizationSlug).queryKey,
      });

      const eventSource = new EventSource(
        rpc.organization[":idOrSlug"].github["delete-status"].$url({
          param: { idOrSlug: organizationSlug },
        }),
        { withCredentials: true },
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data);
      };
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to disconnect GitHub. Please try again.",
      );
    },
  });

  useEffect(() => {
    if (!githubIntegration.data?.syncId) {
      return;
    }

    const eventSource = new EventSource(
      rpc.organization[":idOrSlug"].github["sync-status"].$url({
        param: { idOrSlug: organizationSlug },
      }),
      { withCredentials: true },
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as { status: string };
      console.log(data);
      queryClient.setQueryData(
        getGithubIntegrationQueryOptions(organizationSlug).queryKey,
        (old: any) => {
          if (!old) {
            return null;
          }
          return { ...old, syncStatus: data.status };
        },
      );
    };
  }, [githubIntegration.data, organizationSlug, queryClient]);

  return (
    <>
      {githubIntegration.data?.syncId && (
        <p className="text-sm text-gray-500">
          {githubIntegration.data.syncStatusName}
        </p>
      )}

      {!githubIntegration.data ? (
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
            <Button asChild>
              <a type="button" href={githubAppInstallUrl}>
                <Github className="mr-2 h-4 w-4" />
                Install GitHub App
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
