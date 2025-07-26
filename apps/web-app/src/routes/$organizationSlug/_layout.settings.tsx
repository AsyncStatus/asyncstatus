import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import {
  deleteGithubIntegrationContract,
  getGithubIntegrationContract,
  listGithubRepositoriesContract,
  listGithubUsersContract,
} from "@asyncstatus/api/typed-handlers/github-integration";
import {
  getMemberContract,
  listMembersContract,
  updateMemberContract,
} from "@asyncstatus/api/typed-handlers/member";
import {
  getOrganizationContract,
  listMemberOrganizationsContract,
  updateOrganizationContract,
} from "@asyncstatus/api/typed-handlers/organization";
import {
  deleteSlackIntegrationContract,
  getSlackIntegrationContract,
  listSlackChannelsContract,
  listSlackUsersContract,
} from "@asyncstatus/api/typed-handlers/slack-integration";
import { serializeFormData } from "@asyncstatus/typed-handlers";
import {
  NotSiMicrosoftTeams,
  SiAsana,
  SiClickup,
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import { ImageUpload } from "@asyncstatus/ui/components/image-upload";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@asyncstatus/ui/components/tabs";
import { ArrowRight, CreditCard, Send, XIcon } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import {
  IntegrationSettingsItem,
  IntegrationSuggestionItem,
} from "@/components/integration-settings";
import { UpdateMemberForm } from "@/components/update-member-form";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { ensureValidOrganization, ensureValidSession } from "../-lib/common";

export const Route = createFileRoute("/$organizationSlug/_layout/settings")({
  component: RouteComponent,
  validateSearch: z.object({
    tab: z.enum(["workspace", "integrations", "profile"]).default("workspace"),
  }),
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
  const githubIntegrationQuery = useQuery(
    typedQueryOptions(getGithubIntegrationContract, { idOrSlug: params.organizationSlug }),
  );
  const slackIntegrationQuery = useQuery(
    typedQueryOptions(getSlackIntegrationContract, { idOrSlug: params.organizationSlug }),
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
  const organizationMembers = useQuery(
    typedQueryOptions(listMembersContract, { idOrSlug: params.organizationSlug }),
  );

  const integrations = useMemo(
    () => [
      {
        name: "GitHub",
        description: "Track commits, pull requests, code reviews, and issue management.",
        icon: <SiGithub className="size-3.5" />,
        status: githubIntegrationQuery.data?.syncFinishedAt
          ? "connected"
          : githubIntegrationQuery.data?.syncStartedAt
            ? "connecting"
            : "disconnected",
        connectLink: `https://github.com/apps/${import.meta.env.VITE_GITHUB_INTEGRATION_APP_NAME}/installations/new?state=${params.organizationSlug}`,
        onDisconnect: () => {
          deleteGithubIntegrationMutation.mutate({ idOrSlug: params.organizationSlug });
        },
        settingsChildren: (
          <div className="space-y-6">
            {githubUsers.data?.length === 0 && (
              <div className="text-sm text-muted-foreground">No users found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Users</h4>
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
              <h4 className="font-medium">Repositories</h4>
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
        status: slackIntegrationQuery.data?.syncFinishedAt
          ? "connected"
          : slackIntegrationQuery.data?.syncStartedAt
            ? "connecting"
            : "disconnected",
        connectLink: `https://slack.com/oauth/v2/authorize?state=${params.organizationSlug}&client_id=${import.meta.env.VITE_SLACK_INTEGRATION_APP_CLIENT_ID}&scope=app_mentions:read,channels:history,channels:join,channels:read,chat:write,chat:write.public,commands,emoji:read,files:read,groups:history,groups:read,im:history,im:read,incoming-webhook,mpim:history,mpim:read,pins:read,reactions:read,team:read,users:read,users.profile:read,users:read.email,calls:read,reminders:read,reminders:write,channels:manage,chat:write.customize,im:write,links:read,metadata.message:read,mpim:write,pins:write,reactions:write,dnd:read,usergroups:read,usergroups:write,users:write,remote_files:read,remote_files:write,files:write,groups:write&user_scope=channels:history,channels:read,dnd:read,emoji:read,files:read,groups:history,groups:read,im:history,im:read,mpim:history,mpim:read,pins:read,reactions:read,team:read,users:read,users.profile:read,users:read.email,calls:read,reminders:read,reminders:write,stars:read`,
        onDisconnect: () => {
          deleteSlackIntegrationMutation.mutate({ idOrSlug: params.organizationSlug });
        },
        settingsChildren: (
          <div className="space-y-6">
            {slackUsers.data.length === 0 && (
              <div className="text-sm text-muted-foreground">No users found.</div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Users</h4>
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
              <h4 className="font-medium">Channels</h4>
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
        name: "Linear",
        description: "Sync issue updates, sprint progress, and project milestones.",
        icon: <SiLinear className="size-3.5" />,
        status: "disconnected",
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

  const organizationQuery = useQuery(
    typedQueryOptions(getOrganizationContract, { idOrSlug: params.organizationSlug }),
  );
  const updateOrganizationMutation = useMutation(
    typedMutationOptions(updateOrganizationContract, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getOrganizationContract, { idOrSlug: data.slug }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listMemberOrganizationsContract, {}).queryKey,
        });
        queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            session: { ...sessionData.session, activeOrganizationSlug: data.slug },
          };
        });
        navigate({
          to: "/$organizationSlug/settings",
          params: { organizationSlug: data.slug },
          search,
          replace: true,
        });
      },
    }),
  );
  const form = useForm({
    resolver: zodResolver(updateOrganizationContract.inputSchema),
    defaultValues: {
      idOrSlug: params.organizationSlug,
      name: organizationQuery.data?.organization.name || "",
      slug: organizationQuery.data?.organization.slug || "",
      logo: organizationQuery.data?.organization.logo || null,
    },
  });

  useEffect(() => {
    if (organizationQuery.data) {
      form.reset({
        idOrSlug: params.organizationSlug,
        name: organizationQuery.data.organization.name,
        slug: organizationQuery.data.organization.slug,
        logo: organizationQuery.data.organization.logo,
      });
    }
  }, [organizationQuery.data]);

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
                    to="/$organizationSlug/settings"
                    params={{ organizationSlug: params.organizationSlug }}
                  >
                    Settings
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <a href={import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL} target="_blank" rel="noreferrer">
              <CreditCard />
              Plan and billing
            </a>
          </Button>
        </div>
      </header>

      <div className="py-4">
        <Tabs
          value={search.tab}
          onValueChange={(value) => {
            navigate({
              to: "/$organizationSlug/settings",
              params: { organizationSlug: params.organizationSlug },
              search: { tab: value as typeof search.tab },
              replace: true,
            });
          }}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader className="gap-0.5">
                <CardTitle className="text-xl">Integrations</CardTitle>
                <CardDescription>Connect your favorite tools to your workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 overflow-y-auto h-[calc(100vh-310px)] grid-auto-rows-min items-start">
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
                              integration.status as "connected" | "disconnected" | "connecting"
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="workspace"
            onChange={() => {
              navigate({
                to: "/$organizationSlug/settings",
                params: { organizationSlug: params.organizationSlug },
                search: { tab: search.tab },
                replace: true,
              });
            }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-6! gap-0.5">
                <CardTitle className="text-xl">Workspace</CardTitle>
                <CardDescription>Manage your workspace settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((values) => {
                      updateOrganizationMutation.mutate(
                        serializeFormData({
                          idOrSlug: params.organizationSlug,
                          name: values.name,
                          slug: slugify(values.name),
                          logo: values.logo,
                        }),
                      );
                    })}
                    className="space-y-4"
                  >
                    <div className="grid gap-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => {
                          const value =
                            typeof field.value === "string"
                              ? typedUrl(getFileContract, {
                                  idOrSlug: params.organizationSlug,
                                  fileKey: field.value,
                                })
                              : field.value;

                          return (
                            <FormItem>
                              <FormLabel className="mb-2">Logo</FormLabel>
                              <FormControl>
                                <ImageUpload value={value as string} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={updateOrganizationMutation.isPending}
                      className="w-full"
                    >
                      Save
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader className="pb-6! gap-0.5">
                <CardTitle className="text-xl">Profile</CardTitle>
                <CardDescription>Manage your profile settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <UpdateMemberForm
                  organizationSlugOrId={params.organizationSlug}
                  memberId={organizationQuery.data.member.id}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-6! gap-0.5">
                <CardTitle className="text-xl">Advanced</CardTitle>
                <CardDescription>
                  Do not use this unless you know what you are doing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col border border-border rounded-lg p-4 gap-2 w-fit">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const items = Object.keys(localStorage);
                      items.forEach((item) => {
                        if (item.includes("-json-content-")) {
                          localStorage.removeItem(item);
                        }
                      });
                    }}
                  >
                    Clear local data
                  </Button>
                  <p className="text-xs text-muted-foreground max-w-3xs text-pretty">
                    Clears local data. This will not affect other users. Only use this if you are
                    experiencing issues with the app, specifically with status updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
