import type { Organization } from "@asyncstatus/api";
import { zOrganizationCreate } from "@asyncstatus/api/schema/organization";
import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { toast } from "@asyncstatus/ui/components/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import type { z } from "zod/v4";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import useDebounce from "@/lib/use-debounce";
import { sessionQueryOptions } from "@/rpc/auth";
import {
  createOrganizationMutationOptions,
  getOrganizationQueryOptions,
  listOrganizationsQueryOptions,
} from "@/rpc/organization/organization";

export function CreateOrganizationForm(props: { onSuccess?: (data: Organization) => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(zOrganizationCreate),
    defaultValues: { name: "", slug: "" },
  });
  const name = form.watch("name");
  const slug = form.watch("slug");
  const [debouncedSlug] = useDebounce(slug, 300);
  const existingOrganization = useQuery({
    ...getOrganizationQueryOptions(debouncedSlug),
    retry: 0,
    throwOnError: false,
  });
  const createOrganization = useMutation({
    ...createOrganizationMutationOptions(),
    onSuccess(data) {
      if (!data.organization) {
        toast.error("Failed to create organization");
        return;
      }

      queryClient.invalidateQueries({
        queryKey: listOrganizationsQueryOptions().queryKey,
      });
      queryClient.setQueryData(sessionQueryOptions().queryKey, (sessionData) => {
        if (!sessionData) {
          return sessionData;
        }
        return {
          ...sessionData,
          session: {
            ...sessionData.session,
            activeOrganizationId: data.organization.id,
          },
        };
      });
      props.onSuccess?.({
        ...data.organization,
        createdAt: new Date(data.organization.createdAt),
      });
      navigate({
        to: "/$organizationSlug",
        params: { organizationSlug: data.organization.slug || "" },
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: z.infer<typeof zOrganizationCreate>) => {
    createOrganization.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Acme Inc."
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    form.setValue("slug", slugify(e.target.value));
                  }}
                />
              </FormControl>
              {name && !existingOrganization.isPending && (
                <FormDescription>
                  {name} is {existingOrganization.data ? "taken" : "available"}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={
            createOrganization.isPending ||
            existingOrganization.isPending ||
            Boolean(existingOrganization.data)
          }
        >
          Create organization
        </Button>
      </form>
    </Form>
  );
}
