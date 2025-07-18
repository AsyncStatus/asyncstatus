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
  BreadcrumbList,
  BreadcrumbPage,
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
        typedQueryOptions(getGithubIntegrationContract, {
          idOrSlug: organizationSlug,
        }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(listGithubUsersContract, {
          idOrSlug: organizationSlug,
        }),
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
                            {user.login}
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
                                {member.user.name} ({member.user.email})
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
        status: "disconnected",
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
                <BreadcrumbPage>
                  <Link
                    to="/$organizationSlug/settings"
                    params={{ organizationSlug: params.organizationSlug }}
                  >
                    Settings
                  </Link>
                </BreadcrumbPage>
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
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
