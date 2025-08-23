import {
  getDiscordIntegrationConnectUrl,
  getGithubIntegrationConnectUrl,
  getLinearIntegrationConnectUrl,
  getSlackIntegrationConnectUrl,
} from "@asyncstatus/api/integrations-connect-url";
import {
  getDiscordGatewayStatusContract,
  startDiscordGatewayContract,
  stopDiscordGatewayContract,
} from "@asyncstatus/api/typed-handlers/discord-gateway";
import {
  deleteDiscordIntegrationContract,
  discordIntegrationCallbackContract,
  fetchDiscordMessagesContract,
  getDiscordIntegrationContract,
  listDiscordChannelsContract,
  listDiscordServersContract,
  listDiscordUsersContract,
} from "@asyncstatus/api/typed-handlers/discord-integration";
import {
  deleteGithubIntegrationContract,
  getGithubIntegrationContract,
  githubIntegrationCallbackContract,
  listGithubRepositoriesContract,
  listGithubUsersContract,
  resyncGithubIntegrationContract,
} from "@asyncstatus/api/typed-handlers/github-integration";
import {
  deleteLinearIntegrationContract,
  getLinearIntegrationContract,
  linearIntegrationCallbackContract,
  listLinearIssuesContract,
  listLinearProjectsContract,
  listLinearTeamsContract,
  listLinearUsersContract,
  resyncLinearIntegrationContract,
} from "@asyncstatus/api/typed-handlers/linear-integration";
import {
  getMemberContract,
  listMembersContract,
  updateMemberContract,
} from "@asyncstatus/api/typed-handlers/member";
import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import {
  deleteSlackIntegrationContract,
  getSlackIntegrationContract,
  listSlackChannelsContract,
  listSlackUsersContract,
  slackIntegrationCallbackContract,
} from "@asyncstatus/api/typed-handlers/slack-integration";
import {
  NotSiMicrosoftTeams,
  SiAsana,
  SiClickup,
  SiDiscord,
  SiFigma,
  SiGithub,
  SiGitlab,
  SiGooglemeet,
  SiJira,
  SiLinear,
  SiNotion,
  SiSlack,
  SiTrello,
  SiZoom,
} from "@asyncstatus/ui/brand-icons";
import { Alert, AlertDescription, AlertTitle } from "@asyncstatus/ui/components/alert";
import { Badge } from "@asyncstatus/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import {
  AlertTriangleIcon,
  ArrowRight,
  DownloadIcon,
  PlayIcon,
  Send,
  StopCircleIcon,
  XIcon,
} from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { z } from "zod/v4";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import {
  IntegrationSettingsItem,
  IntegrationSuggestionItem,
} from "@/components/integration-settings";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { ensureValidOrganization, ensureValidSession } from "../-lib/common";

export const Route = createFileRoute("/$organizationSlug/_layout/integrations")({
  validateSearch: z.object({
    "error-title": z.string().optional(),
    "error-description": z.string().optional(),
  }),
  component: RouteComponent,
  loader: async ({ context: { queryClient }, location, params: { organizationSlug } }) => {
    const [organization] = await Promise.all([
      ensureValidOrganization(queryClient, organizationSlug),
      ensureValidSession(queryClient, location),
    ]);

    await Promise.all([
      queryClient.ensureQueryData(
        typedQueryOptions(getOrganizationContract, {
          idOrSlug: organizationSlug,
        }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(getMemberContract, {
          idOrSlug: organizationSlug,
          memberId: organization.member.id,
        }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(getGithubIntegrationContract, { idOrSlug: organizationSlug }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(
          listGithubRepositoriesContract,
          { idOrSlug: organizationSlug },
          { throwOnError: false },
        ),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(
          listGithubUsersContract,
          { idOrSlug: organizationSlug },
          { throwOnError: false },
        ),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(getSlackIntegrationContract, { idOrSlug: organizationSlug }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(
          listSlackChannelsContract,
          { idOrSlug: organizationSlug },
          { throwOnError: false },
        ),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(
          listSlackUsersContract,
          { idOrSlug: organizationSlug },
          { throwOnError: false },
        ),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(getLinearIntegrationContract, { idOrSlug: organizationSlug }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(
          listLinearTeamsContract,
          { idOrSlug: organizationSlug },
          { throwOnError: false },
        ),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(
          listLinearUsersContract,
          { idOrSlug: organizationSlug },
          { throwOnError: false },
        ),
      ),
    ]);
  },
});

function RouteComponent() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "connected" | "disconnected" | "connecting"
  >("all");

  // Clear error message from URL
  const clearError = () => {
    navigate({
      to: "/$organizationSlug/integrations",
      params: { organizationSlug: params.organizationSlug },
      search: {},
      replace: true,
    });
  };

  const githubIntegrationQuery = useQuery(
    typedQueryOptions(getGithubIntegrationContract, { idOrSlug: params.organizationSlug }),
  );
  const resyncGithubIntegrationMutation = useMutation(
    typedMutationOptions(resyncGithubIntegrationContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getGithubIntegrationContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
      },
    }),
  );
  const slackIntegrationQuery = useQuery(
    typedQueryOptions(getSlackIntegrationContract, { idOrSlug: params.organizationSlug }),
  );
  const discordIntegrationQuery = useQuery(
    typedQueryOptions(getDiscordIntegrationContract, { idOrSlug: params.organizationSlug }),
  );
  const linearIntegrationQuery = useQuery(
    typedQueryOptions(getLinearIntegrationContract, { idOrSlug: params.organizationSlug }),
  );
  const resyncLinearIntegrationMutation = useMutation(
    typedMutationOptions(resyncLinearIntegrationContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getLinearIntegrationContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
      },
    }),
  );
  const deleteLinearIntegrationMutation = useMutation(
    typedMutationOptions(deleteLinearIntegrationContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getLinearIntegrationContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listLinearTeamsContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listLinearUsersContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listLinearProjectsContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listLinearIssuesContract, {
            idOrSlug: params.organizationSlug,
            limit: 50,
            offset: 0,
          }).queryKey,
        });
      },
    }),
  );
  const session = useQuery(sessionBetterAuthQueryOptions());
  const deleteGithubIntegrationMutation = useMutation(
    typedMutationOptions(deleteGithubIntegrationContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getGithubIntegrationContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listGithubRepositoriesContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listGithubUsersContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
      },
    }),
  );
  const deleteSlackIntegrationMutation = useMutation(
    typedMutationOptions(deleteSlackIntegrationContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getSlackIntegrationContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listSlackChannelsContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listSlackUsersContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
      },
    }),
  );
  const deleteDiscordIntegrationMutation = useMutation(
    typedMutationOptions(deleteDiscordIntegrationContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getDiscordIntegrationContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listDiscordServersContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listDiscordChannelsContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listDiscordUsersContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
      },
    }),
  );
  const fetchDiscordMessagesMutation = useMutation(
    typedMutationOptions(fetchDiscordMessagesContract),
  );
  const updateMemberMutation = useMutation(
    typedMutationOptions(updateMemberContract, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listMembersContract, {
            idOrSlug: params.organizationSlug,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getMemberContract, {
            idOrSlug: params.organizationSlug,
            memberId: data.id,
          }).queryKey,
        });
        if (data.userId === session.data?.user.id) {
          queryClient.invalidateQueries({
            queryKey: typedQueryOptions(getOrganizationContract, {
              idOrSlug: params.organizationSlug,
            }).queryKey,
          });

          queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData) => {
            if (!sessionData) {
              return sessionData;
            }
            return {
              ...sessionData,
              user: { ...sessionData.user, ...data.user },
            };
          });
        }
      },
    }),
  );
  const githubRepositories = useQuery(
    typedQueryOptions(
      listGithubRepositoriesContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
  );
  const githubUsers = useQuery(
    typedQueryOptions(
      listGithubUsersContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
  );
  const slackChannels = useQuery(
    typedQueryOptions(
      listSlackChannelsContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
  );
  const slackUsers = useQuery({
    ...typedQueryOptions(
      listSlackUsersContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
    select(data) {
      return data.filter((user) => !user.isBot && user.username !== "slackbot");
    },
  });
  const discordServers = useQuery(
    typedQueryOptions(
      listDiscordServersContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
  );
  const discordChannels = useQuery(
    typedQueryOptions(
      listDiscordChannelsContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
  );
  const discordUsers = useQuery({
    ...typedQueryOptions(
      listDiscordUsersContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
    select(data) {
      return data.filter((user) => !user.isBot);
    },
  });
  const organizationMembers = useQuery(
    typedQueryOptions(listMembersContract, { idOrSlug: params.organizationSlug }),
  );
  const linearTeams = useQuery(
    typedQueryOptions(
      listLinearTeamsContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
  );
  const linearUsers = useQuery(
    typedQueryOptions(
      listLinearUsersContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
  );
  const linearProjects = useQuery(
    typedQueryOptions(
      listLinearProjectsContract,
      { idOrSlug: params.organizationSlug },
      { throwOnError: false },
    ),
  );
  const linearIssues = useQuery(
    typedQueryOptions(
      listLinearIssuesContract,
      { idOrSlug: params.organizationSlug, limit: 50, offset: 0 },
      { throwOnError: false },
    ),
  );

  const integrations = useMemo(
    () => [
      {
        name: "GitHub",
        description: "Track commits, pull requests, code reviews, and issue management.",
        icon: <SiGithub className="size-3.5" />,
        status: githubIntegrationQuery.data?.syncErrorAt
          ? "error"
          : githubIntegrationQuery.data?.syncFinishedAt
            ? "connected"
            : githubIntegrationQuery.data?.syncStartedAt
              ? "connecting"
              : "disconnected",
        connectLink: getGithubIntegrationConnectUrl({
          clientId: import.meta.env.VITE_GITHUB_INTEGRATION_APP_NAME,
          redirectUri: typedUrl(githubIntegrationCallbackContract, {}),
          organizationSlug: params.organizationSlug,
        }),
        onDisconnect: () => {
          deleteGithubIntegrationMutation.mutate({ idOrSlug: params.organizationSlug });
        },
        settingsChildren: (
          <div className="space-y-6">
            {githubUsers.data?.length === 0 && (
              <div className="text-sm text-muted-foreground">No users found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Users ({githubUsers.data?.length})</h4>
              {githubUsers.data?.length > 0 && (
                <div className="text-sm text-muted-foreground space-y-2">
                  {githubUsers.data.map((user) => {
                    const member = organizationMembers.data?.members.find(
                      (member) => member.githubId === user.githubId,
                    );

                    return (
                      <div key={user.id} className="flex items-center gap-2">
                        <Button variant="link" asChild className="p-0 text-left">
                          <a href={user.htmlUrl} target="_blank" rel="noreferrer">
                            {user.name || user.login}
                          </a>
                        </Button>
                        <ArrowRight className="size-4" />
                        <Select
                          value={member?.id}
                          onValueChange={(value) => {
                            const member = organizationMembers.data?.members.find(
                              (member) => member.id === value,
                            );
                            if (!member) {
                              return;
                            }
                            updateMemberMutation.mutate({
                              idOrSlug: params.organizationSlug,
                              memberId: member.id,
                              githubId: user.githubId,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select AsyncStatus profile" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizationMembers.data?.members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {member && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              updateMemberMutation.mutate({
                                idOrSlug: params.organizationSlug,
                                memberId: member.id,
                                githubId: null,
                              });
                            }}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {githubRepositories.data?.length === 0 && (
              <div className="text-sm text-muted-foreground">No repositories found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Repositories ({githubRepositories.data?.length})</h4>
              {githubRepositories.data?.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {githubRepositories.data.map((repository) => (
                    <div key={repository.id} className="flex items-center gap-2">
                      <Button variant="link" asChild className="p-0 text-left">
                        <a href={repository.htmlUrl} target="_blank" rel="noreferrer">
                          {repository.name}
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resyncGithubIntegrationMutation.mutate({ idOrSlug: params.organizationSlug });
                }}
              >
                Resync users and repositories
              </Button>
            </div>
          </div>
        ),
        children: (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">What this integration does</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Automatically tracks your GitHub activity in real-time.</li>
                <li>Generates meaningful status updates from your code contributions.</li>
                <li>Links AsyncStatus profiles to your GitHub accounts.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Privacy & Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Read-only access - we never modify your code.</li>
                <li>Secure OAuth authentication with GitHub.</li>
                <li>Data is encrypted in transit and at rest.</li>
                <li>
                  Data is used only for status update generation. We don't store any of your code.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Data we track</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Read-only access to the following GitHub data:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                <li>
                  <strong>Code & Commits:</strong> Track code changes, contributions, and commit
                  history.
                </li>
                <li>
                  <strong>Pull Requests:</strong> Monitor code reviews, merges, and collaboration.
                </li>
                <li>
                  <strong>Issues & Discussions:</strong> Follow bug reports, feature requests, and
                  team discussions.
                </li>
                <li>
                  <strong>Actions & Checks:</strong> Track CI/CD workflows, build statuses, and
                  automated checks.
                </li>
                <li>
                  <strong>Deployments:</strong> Monitor deployment activity and release management.
                </li>
                <li>
                  <strong>Projects & Packages:</strong> Track project boards, package releases, and
                  dependencies.
                </li>
                <li>
                  <strong>Organization Data:</strong> Access team membership, events, and
                  organizational insights.
                </li>
                <li>
                  <strong>Repository Metadata:</strong> Read repository settings, properties, and
                  administration data.
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <strong>Status Example:</strong> "Reviewed 3 pull requests, merged feature/user-auth,
              and resolved 2 critical issues in the dashboard repository."
            </div>
          </div>
        ),
      },
      {
        name: "Slack",
        description: "Monitor channel activity, direct messages, and team communication.",
        icon: <SiSlack className="size-3.5" />,
        status: slackIntegrationQuery.data?.syncErrorAt
          ? "error"
          : slackIntegrationQuery.data?.syncFinishedAt
            ? "connected"
            : slackIntegrationQuery.data?.syncStartedAt
              ? "connecting"
              : "disconnected",
        connectLink: getSlackIntegrationConnectUrl({
          clientId: import.meta.env.VITE_SLACK_INTEGRATION_APP_CLIENT_ID,
          redirectUri: typedUrl(slackIntegrationCallbackContract, {}),
          organizationSlug: params.organizationSlug,
        }),
        onDisconnect: () => {
          deleteSlackIntegrationMutation.mutate({ idOrSlug: params.organizationSlug });
        },
        settingsChildren: (
          <div className="space-y-6">
            {slackUsers.data.length === 0 && (
              <div className="text-sm text-muted-foreground">No users found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Users ({slackUsers.data.length})</h4>
              {slackUsers.data.length > 0 && (
                <div className="text-sm text-muted-foreground space-y-2">
                  {slackUsers.data.map((user) => {
                    const member = organizationMembers.data?.members.find(
                      (member) => member.slackId === user.slackUserId,
                    );

                    return (
                      <div key={user.id} className="flex items-center gap-2">
                        <Button variant="link" asChild className="p-0 text-left">
                          <a
                            href={`https://${slackIntegrationQuery.data?.teamName}.slack.com/team/${user.slackUserId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {user.displayName || user.username || user.slackUserId}
                          </a>
                        </Button>
                        <ArrowRight className="size-4" />
                        <Select
                          value={member?.id}
                          onValueChange={(value) => {
                            const member = organizationMembers.data?.members.find(
                              (member) => member.id === value,
                            );
                            if (!member) {
                              return;
                            }
                            updateMemberMutation.mutate({
                              idOrSlug: params.organizationSlug,
                              memberId: member.id,
                              slackId: user.slackUserId,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select AsyncStatus profile" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizationMembers.data?.members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {member && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              updateMemberMutation.mutate({
                                idOrSlug: params.organizationSlug,
                                memberId: member.id,
                                slackId: null,
                              });
                            }}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {slackChannels.data?.length === 0 && (
              <div className="text-sm text-muted-foreground">No channels found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Channels ({slackChannels.data?.length})</h4>
              {slackChannels.data?.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {slackChannels.data.map((channel) => (
                    <div key={channel.id} className="flex items-center gap-2">
                      <Button variant="link" asChild className="p-0 text-left">
                        <a
                          href={`https://${slackIntegrationQuery.data?.teamName}.slack.com/channels/${channel.channelId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          #{channel.name}
                          <span className="text-xs text-muted-foreground">
                            {channel.isPrivate && " (private)"}
                            {channel.isArchived && " (archived)"}
                            {channel.isShared && " (shared)"}
                            {channel.isIm && " (direct message)"}
                            {channel.isMpim && " (group direct message)"}
                            {channel.isGeneral && " (general channel)"}
                            {channel.isGroup && " (group channel)"}
                          </span>
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ),
        children: (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">What this integration does</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Automatically tracks your Slack communication and activity.</li>
                <li>Generates meaningful status updates from your team conversations.</li>
                <li>Links AsyncStatus profiles to your Slack accounts.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Privacy & Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>
                  Limited, scoped permissions to track communication and collaboration activity.
                </li>
                <li>Can interact with channels and conversations AsyncStatus is added to.</li>
                <li>Cannot access admin settings, billing, or workspace-wide configuration.</li>
                <li>Secure OAuth authentication with Slack.</li>
                <li>Data is encrypted in transit and at rest.</li>
                <li>
                  Data is used only for status update generation. We don't store message content.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Data we track & actions we can perform</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Access to view and interact with the following Slack data:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                <li>
                  <strong>Messages & Conversations:</strong> Track activity in public channels,
                  private channels, and direct messages. Can send messages and start conversations.
                </li>
                <li>
                  <strong>Channel Management:</strong> View channel information, join public
                  channels, and manage channels AsyncStatus is added to.
                </li>
                <li>
                  <strong>User Profiles:</strong> Access profile details, workspace member
                  information, and email addresses.
                </li>
                <li>
                  <strong>Reactions & Pins:</strong> View and add emoji reactions, manage pinned
                  content in conversations.
                </li>
                <li>
                  <strong>Files & Attachments:</strong> View, upload, edit, and delete files in
                  conversations.
                </li>
                <li>
                  <strong>Meeting & Call Data:</strong> Track participation in Slack calls and
                  huddles.
                </li>
                <li>
                  <strong>Workspace Management:</strong> Access workspace settings, manage user
                  groups, create slash commands, and set bot presence.
                </li>
                <li>
                  <strong>Reminders:</strong> Create, edit, and manage reminders for team members.
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <strong>Status Example:</strong> "Led 4 discussions in #engineering, shared project
              updates in 3 channels, and coordinated with the design team on the new feature
              rollout."
            </div>
          </div>
        ),
      },
      {
        name: "Discord",
        description: "Track server activity, voice channels, and community engagement.",
        icon: <SiDiscord className="size-3.5" />,
        status: discordIntegrationQuery.data?.syncErrorAt
          ? "error"
          : discordIntegrationQuery.data?.syncFinishedAt
            ? "connected"
            : discordIntegrationQuery.data?.syncStartedAt
              ? "connecting"
              : "disconnected",
        connectLink: getDiscordIntegrationConnectUrl({
          clientId: import.meta.env.VITE_DISCORD_INTEGRATION_APP_CLIENT_ID,
          redirectUri: typedUrl(discordIntegrationCallbackContract, {}),
          organizationSlug: params.organizationSlug,
        }),
        onDisconnect: () => {
          deleteDiscordIntegrationMutation.mutate({ idOrSlug: params.organizationSlug });
        },
        settingsChildren: (
          <div className="space-y-6">
            {discordUsers.data?.length === 0 && (
              <div className="text-sm text-muted-foreground">No users found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Users ({discordUsers.data?.length})</h4>
              {discordUsers.data && discordUsers.data.length > 0 && (
                <div className="text-sm text-muted-foreground space-y-2 overflow-y-auto max-h-[100px]">
                  {discordUsers.data.map((user) => {
                    const member = organizationMembers.data?.members.find(
                      (member) => member.discordId === user.discordUserId,
                    );

                    return (
                      <div key={user.id} className="flex items-center gap-2">
                        <span>
                          {user.globalName || user.username}
                          {user.discriminator &&
                            user.discriminator !== "0" &&
                            `#${user.discriminator}`}
                        </span>
                        <ArrowRight className="size-4" />
                        <Select
                          value={member?.id}
                          onValueChange={(value) => {
                            const member = organizationMembers.data?.members.find(
                              (member) => member.id === value,
                            );
                            if (!member) {
                              return;
                            }
                            updateMemberMutation.mutate({
                              idOrSlug: params.organizationSlug,
                              memberId: member.id,
                              discordId: user.discordUserId,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select AsyncStatus profile" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizationMembers.data?.members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {member && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              updateMemberMutation.mutate({
                                idOrSlug: params.organizationSlug,
                                memberId: member.id,
                                discordId: null,
                              });
                            }}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {discordServers.data?.length === 0 && (
              <div className="text-sm text-muted-foreground">No servers found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Servers ({discordServers.data?.length})</h4>
              {discordServers.data && discordServers.data.length > 0 && (
                <div className="text-sm text-muted-foreground overflow-y-auto max-h-[100px]">
                  {discordServers.data.map((server) => (
                    <div key={server.id} className="flex items-center gap-2">
                      <span>{server.name}</span>
                      {server.memberCount && (
                        <span className="text-xs text-muted-foreground">
                          ({server.memberCount} members)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {discordChannels.data?.length === 0 && (
              <div className="text-sm text-muted-foreground">No channels found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Channels ({discordChannels.data?.length})</h4>
              {discordChannels.data && discordChannels.data.length > 0 && (
                <div className="text-sm text-muted-foreground overflow-y-auto max-h-[100px]">
                  {discordChannels.data.map((channel) => (
                    <div key={channel.id} className="flex items-center gap-2">
                      <span>
                        #{channel.name}
                        <span className="text-xs text-muted-foreground">
                          {channel.type === 0 && " (text)"}
                          {channel.type === 2 && " (voice)"}
                          {channel.nsfw && " (NSFW)"}
                          {channel.isArchived && " (archived)"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Real-time Discord Gateway</h4>
              <DiscordGatewayControls organizationSlug={params.organizationSlug} />
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Manual Message Sync</h4>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Manually fetch the latest Discord messages for processing. This will fetch up to
                  50 recent messages from all channels and send them for AI summarization.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    fetchDiscordMessagesMutation.mutate({ idOrSlug: params.organizationSlug });
                  }}
                  disabled={fetchDiscordMessagesMutation.isPending}
                >
                  <DownloadIcon className="size-4 mr-2" />
                  {fetchDiscordMessagesMutation.isPending ? "Fetching..." : "Fetch Latest Messages"}
                </Button>
                {fetchDiscordMessagesMutation.error && (
                  <Alert variant="destructive">
                    <AlertTriangleIcon className="size-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {fetchDiscordMessagesMutation.error.message}
                    </AlertDescription>
                  </Alert>
                )}
                {fetchDiscordMessagesMutation.isSuccess && (
                  <Alert>
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      Discord message fetch started successfully. Messages will be processed for AI
                      summarization.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        ),
        children: (
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-medium">What this integration does</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Automatically tracks your Discord activity in real-time.</li>
                <li>Generates meaningful status updates from community interactions.</li>
                <li>Links AsyncStatus profiles to your Discord accounts.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Privacy & Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Read-only access to server data.</li>
                <li>Secure OAuth authentication with Discord.</li>
                <li>Data is encrypted in transit and at rest.</li>
                <li>
                  Data is used only for status update generation. We don't store message content.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Data we track</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Read-only access to the following Discord data:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                <li>
                  <strong>Server Information:</strong> Server names, icons, member counts, and basic
                  metadata.
                </li>
                <li>
                  <strong>Channel Information:</strong> Channel names, types, and topics (text
                  channels only).
                </li>
                <li>
                  <strong>Member Information:</strong> Usernames, avatars, and member lists to link
                  with AsyncStatus profiles.
                </li>
                <li>
                  <strong>Message Activity:</strong> Message events and metadata for activity
                  tracking (content requires Message Content Intent).
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <strong>Status Example:</strong> "Active in #engineering and #product channels,
              participated in design discussions, helped 5 team members in #support channel."
            </div>
          </div>
        ),
      },
      {
        name: "Linear",
        description: "Sync issue updates, sprint progress, and project milestones.",
        icon: <SiLinear className="size-3.5" />,
        status: linearIntegrationQuery.data?.syncErrorAt
          ? "error"
          : linearIntegrationQuery.data?.syncFinishedAt
            ? "connected"
            : linearIntegrationQuery.data?.syncStartedAt
              ? "connecting"
              : "disconnected",
        connectLink: getLinearIntegrationConnectUrl({
          clientId: import.meta.env.VITE_LINEAR_INTEGRATION_APP_CLIENT_ID,
          redirectUri: typedUrl(linearIntegrationCallbackContract, {}),
          organizationSlug: params.organizationSlug,
        }),
        onDisconnect: () => {
          deleteLinearIntegrationMutation.mutate({ idOrSlug: params.organizationSlug });
        },
        settingsChildren: (
          <div className="space-y-6">
            {linearUsers.data?.users?.length === 0 && (
              <div className="text-sm text-muted-foreground">No users found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Users ({linearUsers.data?.users?.length || 0})</h4>
              {linearUsers.data?.users && linearUsers.data.users.length > 0 && (
                <div className="text-sm text-muted-foreground space-y-2">
                  {linearUsers.data.users.map((user) => {
                    const member = organizationMembers.data?.members.find(
                      (member) => member.linearId === user.userId,
                    );

                    return (
                      <div key={user.id} className="flex items-center gap-2">
                        <span>
                          {user.name || user.displayName || user.email || user.userId}
                        </span>
                        <ArrowRight className="size-4" />
                        <Select
                          value={member?.id}
                          onValueChange={(value) => {
                            const member = organizationMembers.data?.members.find(
                              (member) => member.id === value,
                            );
                            if (!member) {
                              return;
                            }
                            updateMemberMutation.mutate({
                              idOrSlug: params.organizationSlug,
                              memberId: member.id,
                              linearId: user.userId,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select AsyncStatus profile" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizationMembers.data?.members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {member && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              updateMemberMutation.mutate({
                                idOrSlug: params.organizationSlug,
                                memberId: member.id,
                                linearId: null,
                              });
                            }}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {linearTeams.data?.teams?.length === 0 && (
              <div className="text-sm text-muted-foreground">No teams found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Teams ({linearTeams.data?.teams?.length || 0})</h4>
              {linearTeams.data?.teams && linearTeams.data.teams.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {linearTeams.data.teams.map((team) => (
                    <div key={team.id} className="flex items-center gap-2">
                      <span>{team.name} ({team.key})</span>
                      {team.issueCount !== null && (
                        <span className="text-xs text-muted-foreground">
                          ({team.issueCount} issues)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {linearProjects.data?.projects?.length === 0 && (
              <div className="text-sm text-muted-foreground">No projects found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Projects ({linearProjects.data?.projects?.length || 0})</h4>
              {linearProjects.data?.projects && linearProjects.data.projects.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {linearProjects.data.projects.map((project) => (
                    <div key={project.id} className="flex items-center gap-2">
                      <span>{project.name}</span>
                      {project.state && (
                        <span className="text-xs text-muted-foreground">({project.state})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resyncLinearIntegrationMutation.mutate({ idOrSlug: params.organizationSlug });
                }}
              >
                Resync teams, users and issues
              </Button>
            </div>
          </div>
        ),
        children: (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">What this integration does</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Automatically tracks your Linear activity in real-time.</li>
                <li>Generates meaningful status updates from your issue progress and project work.</li>
                <li>Links AsyncStatus profiles to your Linear accounts.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Privacy & Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Secure OAuth authentication with Linear.</li>
                <li>Actions are performed by the AsyncStatus app, not individual users.</li>
                <li>Data is encrypted in transit and at rest.</li>
                <li>
                  Data is used only for status update generation. We don't store sensitive project data.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Data we track</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Access to the following Linear data:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                <li>
                  <strong>Issues & Tasks:</strong> Track issue creation, updates, status changes, and
                  completion.
                </li>
                <li>
                  <strong>Projects & Milestones:</strong> Monitor project progress, milestones, and
                  deliverables.
                </li>
                <li>
                  <strong>Teams & Members:</strong> Access team structure and member information for
                  collaboration tracking.
                </li>
                <li>
                  <strong>Comments & Activity:</strong> Track discussions, feedback, and issue
                  activity.
                </li>
                <li>
                  <strong>Cycles & Sprints:</strong> Monitor sprint progress, velocity, and cycle
                  performance.
                </li>
                <li>
                  <strong>Labels & Priorities:</strong> Track issue categorization, priorities, and
                  workflow states.
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <strong>Status Example:</strong> "Completed 8 issues this week, shipped the auth
              feature, reviewed 3 PRs, and started planning the next sprint milestone."
            </div>
          </div>
        ),
      },
      {
        name: "GitLab",
        description: "Monitor merge requests, CI/CD pipelines, and repository activity.",
        icon: <SiGitlab className="size-3.5" />,
        status: "disconnected",
      },
      {
        name: "Asana",
        description: "Track task completions, project updates, and team assignments.",
        icon: <SiAsana className="size-3.5" />,
        status: "disconnected",
      },
      {
        name: "Jira",
        description: "Track ticket status, sprint progress, and bug resolution.",
        icon: <SiJira className="size-3.5" />,
        status: "disconnected",
      },
      {
        name: "Google Meet",
        description: "Track meeting attendance, duration, and collaboration sessions.",
        icon: <SiGooglemeet className="size-3.5" />,
        status: "disconnected",
      },
      {
        name: "Microsoft Teams",
        description: "Track meeting attendance, duration, and collaboration sessions.",
        icon: <NotSiMicrosoftTeams className="size-3.5 dark:fill-white" />,
        status: "disconnected",
      },
      {
        name: "Zoom",
        description: "Monitor meeting participation, recording activity, and team calls.",
        icon: <SiZoom className="size-3.5" />,
        status: "disconnected",
      },
      {
        name: "ClickUp",
        description: "Monitor task status, time tracking, and goal progress.",
        icon: <SiClickup className="size-3.5" />,
        status: "disconnected",
      },
      {
        name: "Trello",
        description: "Monitor card movements, board updates, and task progress.",
        icon: <SiTrello className="size-3.5" />,
        status: "disconnected",
      },
      {
        name: "Notion",
        description: "Track page edits, database updates, and workspace activity.",
        icon: <SiNotion className="size-3.5" />,
        status: "disconnected",
      },
      {
        name: "Figma",
        description: "Track design updates, prototype changes, and design reviews.",
        icon: <SiFigma className="size-3.5" />,
        status: "disconnected",
      },
    ],
    [
      githubIntegrationQuery.data,
      githubRepositories.data,
      githubUsers.data,
      slackIntegrationQuery.data,
      slackChannels.data,
      slackUsers.data,
      discordIntegrationQuery.data,
      discordServers.data,
      discordChannels.data,
      discordUsers.data,
      linearIntegrationQuery.data,
      linearTeams.data,
      linearUsers.data,
      linearProjects.data,
      linearIssues.data,
      organizationMembers.data,
    ],
  );

  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      const matchesSearch =
        integration.name.toLowerCase().includes(searchText.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "connected" && integration.status === "connected") ||
        (statusFilter === "disconnected" && integration.status === "disconnected");

      return matchesSearch && matchesStatus;
    });
  }, [integrations, searchText, statusFilter]);

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/$organizationSlug/integrations"
                    params={{ organizationSlug: params.organizationSlug }}
                  >
                    Integrations
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {(search["error-title"] || search["error-description"]) && (
        <Alert
          variant="destructive"
          className="mt-4 flex items-center justify-between border border-destructive/50"
        >
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4" />
              <AlertTitle className="text-base font-medium">
                {search["error-title"] || "Error"}
              </AlertTitle>
            </div>
            <AlertDescription className="flex items-start justify-between">
              <span className="text-foreground">
                {search["error-description"] || "Something went wrong. Please try again."}
              </span>
            </AlertDescription>
          </div>
          <Button variant="outline" onClick={clearError} className="text-foreground">
            <span className="sr-only">Close error</span>
            <XIcon className="size-4" />
          </Button>
        </Alert>
      )}

      <div className="flex items-center gap-2 py-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="disconnected">Disconnected</SelectItem>
            <SelectItem value="connecting">Connecting</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="text"
          placeholder="Search for an integration"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 overflow-y-auto h-[calc(100vh-150px)] grid-auto-rows-min items-start">
        {filteredIntegrations.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="space-y-2">
              <p>No integrations found matching your search criteria.</p>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Don't see the integration you're looking for?
                </p>
                <Button asChild size="sm">
                  <a
                    href="mailto:kacper@asyncstatus.com?subject=Integration Suggestion&body=I'd like to suggest adding support for: [Tool Name]%0A%0AUse case: [How you would use this integration]%0A%0AAdditional context: [Any other relevant information]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Send className="size-3" />
                    Suggest an integration
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          filteredIntegrations.map((integration, index) => {
            return (
              <Fragment key={integration.name}>
                {index === 3 && <IntegrationSuggestionItem />}
                <IntegrationSettingsItem
                  name={integration.name}
                  description={integration.description}
                  icon={integration.icon}
                  status={
                    integration.status as "connected" | "disconnected" | "connecting" | "error"
                  }
                  connectLink={integration.connectLink}
                  onDisconnect={integration.onDisconnect}
                  onViewDetails={() => {}}
                  onSettings={() => {}}
                  settingsChildren={integration.settingsChildren}
                >
                  {integration.children}
                </IntegrationSettingsItem>
              </Fragment>
            );
          })
        )}
      </div>
    </>
  );
}

function DiscordGatewayControls({ organizationSlug }: { organizationSlug: string }) {
  const queryClient = useQueryClient();

  const gatewayStatusQuery = useQuery(
    typedQueryOptions(getDiscordGatewayStatusContract, {
      idOrSlug: organizationSlug,
    }),
  );

  const startGatewayMutation = useMutation(
    typedMutationOptions(startDiscordGatewayContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getDiscordGatewayStatusContract, {
            idOrSlug: organizationSlug,
          }).queryKey,
        });
      },
    }),
  );

  const stopGatewayMutation = useMutation(
    typedMutationOptions(stopDiscordGatewayContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getDiscordGatewayStatusContract, {
            idOrSlug: organizationSlug,
          }).queryKey,
        });
      },
    }),
  );

  const handleStart = () => {
    startGatewayMutation.mutate({ idOrSlug: organizationSlug });
  };

  const handleStop = () => {
    stopGatewayMutation.mutate({ idOrSlug: organizationSlug });
  };

  const isLoading =
    gatewayStatusQuery.isLoading || startGatewayMutation.isPending || stopGatewayMutation.isPending;

  const isConnected = gatewayStatusQuery.data?.isConnected;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isLoading ? "Loading..." : isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {gatewayStatusQuery.data && (
        <div className="text-xs text-muted-foreground space-y-1">
          {gatewayStatusQuery.data.lastHeartbeat && (
            <div>
              Last heartbeat: {new Date(gatewayStatusQuery.data.lastHeartbeat).toLocaleString()}
            </div>
          )}
          {gatewayStatusQuery.data.sessionId && (
            <div>Session ID: {gatewayStatusQuery.data.sessionId}</div>
          )}
          <div>Connection attempts: {gatewayStatusQuery.data.connectionAttempts}</div>
          {gatewayStatusQuery.data.sequenceNumber && (
            <div>Sequence number: {gatewayStatusQuery.data.sequenceNumber}</div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={isConnected ? "secondary" : "default"}
          onClick={handleStart}
          disabled={isLoading || isConnected}
        >
          <PlayIcon className="size-4 mr-2" />
          Start Gateway
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleStop}
          disabled={isLoading || !isConnected}
        >
          <StopCircleIcon className="size-4 mr-2" />
          Stop Gateway
        </Button>
      </div>

      {(startGatewayMutation.error || stopGatewayMutation.error) && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {startGatewayMutation.error?.message || stopGatewayMutation.error?.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-muted-foreground">
        The Discord Gateway enables real-time message processing and event tracking. When connected,
        your Discord events will be processed immediately for status updates.
      </div>
    </div>
  );
}
