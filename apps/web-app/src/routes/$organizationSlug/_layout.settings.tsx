import React from "react";
import { sessionQueryOptions } from "@/rpc/auth";
import {
  getOrganizationQueryOptions,
  listOrganizationsQueryOptions,
  updateOrganizationMutationOptions,
} from "@/rpc/organization/organization";
import { zOrganizationUpdate } from "@asyncstatus/api/schema/organization";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import { Card, CardContent } from "@asyncstatus/ui/components/card";
import { ImageUpload } from "@asyncstatus/ui/components/image-upload";
import { Input } from "@asyncstatus/ui/components/input";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@asyncstatus/ui/components/tabs";
import { CreditCard, Github } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "@sindresorhus/slugify";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useForm } from "react-hook-form";

import { getFileUrl } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { GitHubIntegrationButton } from "@/components/github-integration-button";

// Add types for the member
interface Member {
  id: string;
  slackUsername?: string | null;
  role: string;
  [key: string]: any;
}

export const Route = createFileRoute("/$organizationSlug/_layout/settings")({
  component: RouteComponent,
});

// Add profile mutation function
async function updateMemberSlackUsername(
  organizationSlug: string,
  data: { slackUsername?: string | null },
) {
  const response = await fetch(
    `/api/organization/${organizationSlug}/members/me/slack`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update Slack username");
  }

  return response.json();
}

function RouteComponent() {
  const params = useParams({ from: "/$organizationSlug" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const organizationQuery = useSuspenseQuery(
    getOrganizationQueryOptions(params.organizationSlug),
  );
  const updateOrganizationMutation = useMutation({
    ...updateOrganizationMutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: getOrganizationQueryOptions(data.slug).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: getOrganizationQueryOptions(params.organizationSlug).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: listOrganizationsQueryOptions().queryKey,
      });
      queryClient.setQueryData(
        sessionQueryOptions().queryKey,
        (sessionData) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            session: { ...sessionData.session, activeOrganizationId: data.id },
          };
        },
      );
      navigate({
        to: "/$organizationSlug/settings",
        params: { organizationSlug: data.slug },
        replace: true,
      });
    },
  });
  const form = useForm({
    resolver: zodResolver(zOrganizationUpdate),
    defaultValues: {
      name: organizationQuery.data?.organization.name || "",
      slug: organizationQuery.data?.organization.slug || "",
      logo: organizationQuery.data?.organization.logo || null,
    },
  });

  // Add profile form state
  const sessionQuery = useSuspenseQuery(sessionQueryOptions());
  const currentUser = sessionQuery.data?.user;
  const [slackUsername, setSlackUsername] = React.useState("");

  // Get the current member to get their slack username
  const currentMemberQuery = useSuspenseQuery<{
    id: string;
    slackUsername?: string | null;
  }>({
    queryKey: ["currentMember", params.organizationSlug],
    queryFn: async () => {
      const response = await fetch(
        `/api/organization/${params.organizationSlug}/members/me`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch current member");
      }
      return response.json();
    },
  });

  React.useEffect(() => {
    if (currentMemberQuery.data?.slackUsername) {
      setSlackUsername(currentMemberQuery.data.slackUsername);
    }
  }, [currentMemberQuery.data]);

  const profileMutation = useMutation({
    mutationFn: (data: { slackUsername?: string | null }) =>
      updateMemberSlackUsername(params.organizationSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentMember", params.organizationSlug],
      });
    },
  });

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <a
              href={import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL}
              target="_blank"
              rel="noreferrer"
            >
              <CreditCard />
              Plan and billing
            </a>
          </Button>
        </div>
      </header>

      <div className="py-4">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((values: any) => {
                      updateOrganizationMutation.mutate({
                        param: { idOrSlug: params.organizationSlug },
                        form: { ...values, slug: slugify(values.name) },
                      });
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
                              ? getFileUrl({
                                  param: { idOrSlug: params.organizationSlug },
                                  query: { fileKey: field.value },
                                })
                              : field.value;

                          return (
                            <FormItem>
                              <FormLabel className="mb-2">Logo</FormLabel>
                              <FormControl>
                                <ImageUpload
                                  value={value}
                                  onChange={field.onChange}
                                />
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
                    >
                      Save changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white">
                        <Github className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium">GitHub</h3>
                        <p className="text-sm text-gray-500">
                          Connect your GitHub organization for team integration
                        </p>
                      </div>
                    </div>
                    <GitHubIntegrationButton
                      organizationSlug={params.organizationSlug}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    profileMutation.mutate({
                      slackUsername: slackUsername || null,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-5">
                    <div>
                      <FormLabel>Slack Username</FormLabel>
                      <FormControl>
                        <Input
                          value={slackUsername}
                          onChange={(e) => setSlackUsername(e.target.value)}
                          placeholder="Enter your Slack username"
                        />
                      </FormControl>
                      <p className="mt-1 text-sm text-gray-500">
                        Connect your Slack account to use the /asyncstatus
                        command in this organization
                      </p>
                    </div>
                  </div>

                  <Button type="submit" disabled={profileMutation.isPending}>
                    Save Slack Username
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
