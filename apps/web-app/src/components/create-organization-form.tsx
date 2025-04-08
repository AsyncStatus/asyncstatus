import { sessionQueryOptions } from "@/rpc/auth";
import {
  checkOrganizationSlugQueryOptions,
  createOrganizationMutationOptions,
  listOrganizationsQueryOptions,
} from "@/rpc/organization/organization";
import { zOrganizationCreate } from "@asyncstatus/api/schema/organization";
import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { toast } from "@asyncstatus/ui/components/sonner";
import { Check, X } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { authClient } from "@/lib/auth";
import useDebounce from "@/lib/use-debounce";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";

export function CreateOrganizationForm(props: {
  onSuccess?: (data: typeof authClient.$Infer.ActiveOrganization) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(zOrganizationCreate),
    defaultValues: { name: "", slug: "" },
  });
  const name = form.watch("name");
  const [debouncedName] = useDebounce(name, 300);
  const checkOrganizationSlug = useQuery({
    ...checkOrganizationSlugQueryOptions(
      debouncedName.length >= 3 ? slugify(debouncedName) : "",
    ),
    retry: 0,
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
      queryClient.setQueryData(
        sessionQueryOptions().queryKey,
        (sessionData) => {
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
        },
      );
      props.onSuccess?.(data.organization as any);
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
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization slug</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="acme-inc"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!form.getValues("slug")) {
                        form.setValue("slug", slugify(e.target.value));
                      }
                    }}
                  />
                  {checkOrganizationSlug.data ===
                  undefined ? null : checkOrganizationSlug.data ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </FormControl>
              <FormDescription>
                This will be used in the URL of your organization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={
            createOrganization.isPending ||
            checkOrganizationSlug.isPending ||
            !checkOrganizationSlug.data
          }
        >
          Create organization
        </Button>
      </form>
    </Form>
  );
}
