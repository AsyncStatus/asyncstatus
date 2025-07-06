import type {
  SyncGithubWorkflowStatusName,
  SyncGithubWorkflowStatusStep,
} from "@asyncstatus/api/schema/github-integration";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import { toast } from "@asyncstatus/ui/components/sonner";
import { AlertCircle, CheckCircle, Github, Loader2 } from "@asyncstatus/ui/icons";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  disconnectGithubMutationOptions,
  getGithubIntegrationQueryOptions,
} from "@/rpc/organization/github";
import { rpc } from "@/rpc/rpc";

type GitHubIntegrationCardProps = {
  organizationSlug: string;
};

type SyncStatus = {
  status: string;
  name?: keyof typeof SyncGithubWorkflowStatusName;
  step?: keyof typeof SyncGithubWorkflowStatusStep;
};

const syncStages = [
  {
    key: "start" as const,
    label: "Starting Sync",
    description: "Initializing GitHub integration",
  },
  {
    key: "fetch_and_sync_repositories" as const,
    label: "Syncing Repositories",
    description: "Fetching repository data from GitHub",
  },
  {
    key: "fetch_and_sync_users" as const,
    label: "Syncing Users",
    description: "Fetching user information",
  },
  {
    key: "fetch_and_sync_events" as const,
    label: "Syncing Events",
    description: "Fetching recent activity and events",
  },
  {
    key: "process_events" as const,
    label: "Processing Data",
    description: "Finalizing sync and processing events",
  },
];

const getStepIcon = (step?: keyof typeof SyncGithubWorkflowStatusStep) => {
  switch (step) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "error":
      return <AlertCircle className="text-destructive h-4 w-4" />;
    case "pending":
    default:
      return <Loader2 className="text-primary h-4 w-4 animate-spin" />;
  }
};

export function GitHubIntegrationCard({ organizationSlug }: GitHubIntegrationCardProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: "completed",
  });
  const queryClient = useQueryClient();
  const githubIntegration = useSuspenseQuery(getGithubIntegrationQueryOptions(organizationSlug));
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
        console.log("Delete status:", data);
      };
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect GitHub. Please try again.",
      );
    },
  });

  useEffect(() => {
    if (!githubIntegration.data?.syncId) {
      setSyncStatus({ status: "completed" });
      return;
    }

    const eventSource = new EventSource(
      rpc.organization[":idOrSlug"].github["sync-status"].$url({
        param: { idOrSlug: organizationSlug },
      }),
      { withCredentials: true },
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as SyncStatus;
      console.log("Sync status:", data);
      setSyncStatus(data);

      queryClient.setQueryData(
        getGithubIntegrationQueryOptions(organizationSlug).queryKey,
        (old: any) => {
          if (!old) return null;
          return { ...old, syncStatus: data.status };
        },
      );
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [githubIntegration.data, organizationSlug, queryClient]);

  const isConnected = !!githubIntegration.data;
  const isSyncing = syncStatus.status === "running" && syncStatus.name;
  const currentStageIndex = syncStatus.name
    ? syncStages.findIndex((stage) => stage.key === syncStatus.name)
    : -1;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Your GitHub integration is active"
            : "Connect your GitHub organization to enable integration"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {!isConnected ? (
          <div className="py-4 text-center">
            <Github className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              Connect your GitHub organization to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {isSyncing ? (
                <motion.div
                  key="syncing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {syncStages.map((stage, index) => {
                    const isActive = index === currentStageIndex;
                    const isCompleted = index < currentStageIndex;
                    const isPending = index > currentStageIndex;

                    return (
                      <motion.div
                        key={stage.key}
                        layout
                        initial={{ opacity: 0.3 }}
                        animate={{
                          opacity: isActive ? 1 : isPending ? 0.3 : 0.7,
                          scale: isActive ? 1.01 : 1,
                        }}
                        className={`flex items-center gap-2 rounded-md border p-2 transition-colors ${
                          isActive
                            ? "border-primary/30 bg-primary/5"
                            : isCompleted
                              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                              : "border-border bg-muted/30"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {isActive ? (
                            getStepIcon(syncStatus.step)
                          ) : isCompleted ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <div className="border-muted-foreground/30 h-3 w-3 rounded-full border" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-medium ${
                              isActive
                                ? "text-primary"
                                : isCompleted
                                  ? "text-green-700 dark:text-green-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {stage.label}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-2 text-center"
                >
                  <CheckCircle className="mx-auto mb-1 h-6 w-6 text-green-600" />
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    Integration Active
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!isConnected ? (
          <Button asChild className="w-full">
            <a href={githubAppInstallUrl}>
              <Github className="mr-2 h-4 w-4" />
              Install GitHub App
            </a>
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={() => disconnectGithub.mutate({ param: { idOrSlug: organizationSlug } })}
            disabled={disconnectGithub.isPending}
            className="w-full"
          >
            {disconnectGithub.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Disconnect GitHub
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
