import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import {
  getGithubIntegrationContract,
  listGithubRepositoriesContract,
  listGithubUsersContract,
} from "@asyncstatus/api/typed-handlers/github-integration";
import { getMemberContract } from "@asyncstatus/api/typed-handlers/member";
import {
  getOrganizationContract,
  listMemberOrganizationsContract,
  updateOrganizationContract,
} from "@asyncstatus/api/typed-handlers/organization";
import {
  getSlackIntegrationContract,
  listSlackChannelsContract,
  listSlackUsersContract,
} from "@asyncstatus/api/typed-handlers/slack-integration";
import { serializeFormData } from "@asyncstatus/typed-handlers";
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
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@asyncstatus/ui/components/tabs";
import { CreditCard } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { UpdateMemberForm } from "@/components/update-member-form";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { ensureValidOrganization, ensureValidSession } from "../-lib/common";

export const Route = createFileRoute("/$organizationSlug/_layout/settings")({
  component: RouteComponent,
  validateSearch: z.object({
    tab: z.enum(["organization", "profile"]).default("organization"),
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
            <Link
              to="/$organizationSlug/billing"
              params={{ organizationSlug: params.organizationSlug }}
            >
              <CreditCard />
              Plan and billing
            </Link>
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
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent
            value="organization"
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
                <CardTitle className="text-xl">Organization</CardTitle>
                <CardDescription>Manage your organization settings.</CardDescription>
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
