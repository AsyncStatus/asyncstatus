import { sessionQueryOptions } from "@/rpc/auth";
import {
  getOrganizationQueryOptions,
  listOrganizationsQueryOptions,
  updateOrganizationMutationOptions,
} from "@/rpc/organization";
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
import { CreditCard } from "@asyncstatus/ui/icons";
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

export const Route = createFileRoute("/$organizationSlug/_layout/settings")({
  component: RouteComponent,
});

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
        queryKey: getOrganizationQueryOptions(data.slug!).queryKey,
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
        params: { organizationSlug: data.slug! },
        replace: true,
      });
    },
  });
  const form = useForm({
    resolver: zodResolver(zOrganizationUpdate),
    defaultValues: {
      name: organizationQuery.data?.name || "",
      slug: organizationQuery.data?.slug || "",
      logo: organizationQuery.data?.logo || null,
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
        </Tabs>
      </div>
    </>
  );
}
