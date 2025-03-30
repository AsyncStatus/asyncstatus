import { sessionQueryOptions } from "@/rpc/auth";
import {
  checkOrganizationSlugQueryOptions,
  createOrganizationAndSetActiveMutationOptions,
  listOrganizationsQueryOptions,
} from "@/rpc/organization";
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

const schema = z.object({ name: z.string().min(3).max(128) });

export function CreateOrganizationForm(props: {
  onSuccess?: (data: typeof authClient.$Infer.ActiveOrganization) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
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
    ...createOrganizationAndSetActiveMutationOptions(),
    onSuccess(data) {
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
      props.onSuccess?.(data);
      navigate({
        to: "/$organizationSlug",
        params: { organizationSlug: data.slug },
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          createOrganization.mutate({
            name: data.name,
            slug: slugify(data.name),
          });
        })}
        className="mx-auto w-full space-y-24"
      >
        <div className="grid gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-end justify-between">
                  <FormLabel>Organization name</FormLabel>
                </div>
                <FormControl>
                  <Input placeholder="Apple Inc." {...field} />
                </FormControl>
                <FormDescription
                  data-state={checkOrganizationSlug.error ? "error" : "success"}
                  className="text-muted-foreground data-[state=error]:text-destructive h-4 data-[state=success]:text-green-500"
                >
                  {checkOrganizationSlug.isFetched &&
                    checkOrganizationSlug.error && (
                      <div className="flex items-center gap-0.5">
                        <X className="size-4" />
                        Name is already taken
                      </div>
                    )}

                  {checkOrganizationSlug.isFetched &&
                    !checkOrganizationSlug.error && (
                      <div className="flex items-center gap-0.5">
                        <Check className="size-4" />
                        Name is available
                      </div>
                    )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={
              createOrganization.isPending ||
              debouncedName !== name ||
              checkOrganizationSlug.isPending ||
              Boolean(
                checkOrganizationSlug.isFetched && checkOrganizationSlug.error,
              )
            }
          >
            Create organization
          </Button>
        </div>
      </form>
    </Form>
  );
}
