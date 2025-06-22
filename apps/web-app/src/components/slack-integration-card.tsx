import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import { Button } from "@asyncstatus/ui/components/button";
import { Badge } from "@asyncstatus/ui/components/badge";
import { Slack, Check, Settings } from "lucide-react";

interface SlackIntegrationCardProps {
  organizationSlug: string;
}

export function SlackIntegrationCard({ organizationSlug }: SlackIntegrationCardProps) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Slack className="h-6 w-6" />
            <div>
              <CardTitle>Slack</CardTitle>
              <CardDescription>
                Enable team members to update their status using Slack commands
              </CardDescription>
            </div>
          </div>
          {slackIntegration.data && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {slackIntegration.data ? (
              <p>Connected to workspace: <strong>{slackIntegration.data.teamName}</strong></p>
            ) : (
              <p>Connect your Slack workspace to enable /asyncstatus commands</p>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link to="/$organizationSlug/settings/slack" params={{ organizationSlug }}>
              <Settings className="mr-2 h-4 w-4" />
              Manage
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}