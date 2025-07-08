import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { getMemberContract } from "@asyncstatus/api/typed-handlers/member";
import {
  getOrganizationContract,
  listMemberOrganizationsContract,
  updateOrganizationContract,
} from "@asyncstatus/api/typed-handlers/organization";
import { serializeFormData } from "@asyncstatus/typed-handlers";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@asyncstatus/ui/components/tabs";
import { CreditCard } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { GitHubIntegrationCard } from "@/components/github-integration-card";
import { UpdateMemberForm } from "@/components/update-member-form";
import { sessionBetterAuthQueryOptions } from "@/rpc/auth";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { ensureValidOrganization, ensureValidSession } from "../-lib/common";

export const Route = createFileRoute("/$organizationSlug/_layout/settings")({
  component: RouteComponent,
  validateSearch: z.object({
    tab: z.enum(["workspace", "profile", "integrations"]).default("workspace"),
  }),
  loader: async ({ context: { queryClient }, location, params: { organizationSlug } }) => {
    const [organization] = await Promise.all([
      ensureValidOrganization(queryClient, organizationSlug),
      ensureValidSession(queryClient, location),
    ]);

    queryClient.prefetchQuery(
      typedQueryOptions(getOrganizationContract, {
        idOrSlug: organizationSlug,
      }),
    );
    queryClient.prefetchQuery(
      typedQueryOptions(getMemberContract, {
        idOrSlug: organizationSlug,
        memberId: organization.member.id,
      }),
    );
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
            session: { ...sessionData.session, activeOrganizationId: data.id },
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
      name: organizationQuery.data?.organization.name || "",
      slug: organizationQuery.data?.organization.slug || "",
      logo: organizationQuery.data?.organization.logo || null,
    },
  });

  useEffect(() => {
    if (organizationQuery.data) {
      form.reset({
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
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

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

                    <Button type="submit" disabled={updateOrganizationMutation.isPending}>
                      Save changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <GitHubIntegrationCard organizationSlug={params.organizationSlug} />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
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
