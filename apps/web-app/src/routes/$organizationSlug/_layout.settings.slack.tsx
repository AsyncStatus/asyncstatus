import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import { Button } from "@asyncstatus/ui/components/button";
import { Badge } from "@asyncstatus/ui/components/badge";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { Alert, AlertDescription } from "@asyncstatus/ui/components/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@asyncstatus/ui/components/dialog";
import { Slack, Check, X, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getOrganizationQueryOptions } from "@/lib/queries";

export const Route = createFileRoute(
  "/$organizationSlug/_layout/settings/slack",
)({
  component: RouteComponent,
  loader: async ({
    context: { queryClient },
    params: { organizationSlug },
  }) => {
    await queryClient.ensureQueryData(
      getOrganizationQueryOptions(organizationSlug),
    );
  },
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const organization = useQuery(getOrganizationQueryOptions(organizationSlug));
  
  const slackIntegration = useQuery({
    queryKey: ["slack-integration", organizationSlug],
    queryFn: async () => {
      const response = await fetch(`/api/organization/${organizationSlug}/slack/integration`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch Slack integration");
      }
      return response.json();
    },
  });

  const connectSlack = useMutation({
    mutationFn: async () => {
      // Redirect to Slack OAuth flow
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_SLACK_CLIENT_ID || "",
        scope: "chat:write,commands,users:read,app_mentions:read,channels:history,groups:history,im:history,mpim:history",
        redirect_uri: `${window.location.origin}/api/slack/oauth/callback`,
        state: organizationSlug,
      });
      
      window.location.href = `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    },
  });

  const disconnectSlack = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/organization/${organizationSlug}/slack/integration`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to disconnect Slack integration");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-integration", organizationSlug] });
      toast.success("Slack integration disconnected successfully");
      setDisconnectDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to disconnect Slack integration");
    },
  });

  const isAdmin =
    organization.data?.member.role === "admin" ||
    organization.data?.member.role === "owner";

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be an admin or owner to manage Slack integration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Slack Integration</h1>
        <p className="text-muted-foreground mt-2">
          Connect your Slack workspace to enable status updates via Slack commands.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Slack className="h-6 w-6" />
              <CardTitle>Slack Workspace</CardTitle>
            </div>
            {slackIntegration.data && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>
          <CardDescription>
            Connect your Slack workspace to enable team members to update their status using the /asyncstatus command.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slackIntegration.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : slackIntegration.data ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{slackIntegration.data.teamName}</p>
                    <p className="text-sm text-muted-foreground">
                      Team ID: {slackIntegration.data.teamId}
                    </p>
                  </div>
                  <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <X className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Disconnect Slack Integration?</DialogTitle>
                        <DialogDescription>
                          This will remove the Slack integration from your organization. Team members will no longer be able to use the /asyncstatus command.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setDisconnectDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => disconnectSlack.mutate()}
                          disabled={disconnectSlack.isPending}
                        >
                          {disconnectSlack.isPending ? "Disconnecting..." : "Disconnect"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Team members need to link their Slack accounts in their user profile to use the /asyncstatus command.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No Slack workspace connected. Connect your workspace to enable status updates via Slack.
              </p>
              <Button onClick={() => connectSlack.mutate()} disabled={connectSlack.isPending}>
                <Slack className="mr-2 h-4 w-4" />
                {connectSlack.isPending ? "Connecting..." : "Connect Slack Workspace"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>
            Learn how to use AsyncStatus with Slack
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">For Administrators:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Connect your Slack workspace using the button above</li>
              <li>The AsyncStatus bot will be added to your workspace</li>
              <li>Team members can link their Slack accounts in their user profiles</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">For Team Members:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to your user profile and link your Slack account</li>
              <li>Use the <code className="bg-muted px-1 py-0.5 rounded">/asyncstatus</code> command in any channel</li>
              <li>Example: <code className="bg-muted px-1 py-0.5 rounded">/asyncstatus Working on the Q2 report</code></li>
              <li>Your status will be posted to the channel and saved in AsyncStatus</li>
            </ol>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Privacy Note:</strong> The AsyncStatus bot can only read messages where it's mentioned or when the /asyncstatus command is used. It cannot read general channel messages.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}