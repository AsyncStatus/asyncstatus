import {
  createOrganizationContract,
  getOrganizationContract,
  listMemberOrganizationsContract,
} from "@asyncstatus/api/typed-handlers/organization";
import { serializeFormData } from "@asyncstatus/typed-handlers";
import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { toast } from "@asyncstatus/ui/components/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
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
import { sessionBetterAuthQueryOptions } from "@/rpc/auth";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";

export function CreateOrganizationForm(props: {
  onSuccess?: (data: typeof createOrganizationContract.$infer.output) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(createOrganizationContract.inputSchema),
    defaultValues: { name: "", slug: "" },
  });
  const name = form.watch("name");
  const slug = form.watch("slug");
  const [debouncedSlug] = useDebounce(slug, 300);
  const existingOrganization = useQuery({
    ...typedQueryOptions(getOrganizationContract, { idOrSlug: debouncedSlug }),
    retry: 0,
    throwOnError: false,
  });
  const createOrganization = useMutation({
    ...typedMutationOptions(createOrganizationContract),
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: typedQueryOptions(listMemberOrganizationsContract, {}).queryKey,
      });
      queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData) => {
        if (!sessionData) {
          return sessionData;
        }
        return {
          ...sessionData,
          session: { ...sessionData.session, activeOrganizationSlug: data.organization.slug },
        };
      });
      props.onSuccess?.(data);
      navigate({
        to: "/$organizationSlug",
        params: { organizationSlug: data.organization.slug || "" },
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: typeof createOrganizationContract.$infer.input) => {
    if (existingOrganization.data?.organization.slug === values.slug) {
      toast.error("Organization already exists");
      return;
    }
    createOrganization.mutate(serializeFormData(values));
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
          disabled={createOrganization.isPending || existingOrganization.isPending}
        >
          Create organization
        </Button>
      </form>
    </Form>
  );
}
