import { Button } from "@asyncstatus/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@asyncstatus/ui/components/form";
import { Input } from "@asyncstatus/ui/components/input";
import { toast } from "@asyncstatus/ui/components/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "@sindresorhus/slugify";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/create-organization/_layout/")({
  component: RouteComponent,
});

const schema = z.object({ name: z.string().min(1) });

function RouteComponent() {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });
  const createOrganization = useMutation({
    mutationFn: async (params: z.infer<typeof schema>) => {
      const response = await authClient.organization.create({
        name: params.name,
        slug: slugify(params.name),
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const activeResponse = await authClient.organization.setActive({
        organizationId: response.data.id,
      });
      if (activeResponse.error) {
        throw new Error(activeResponse.error.message);
      }

      return response.data;
    },
    onSuccess(data) {
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
          createOrganization.mutate(data);
        })}
        className="mx-auto w-full max-w-xs space-y-24"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-2xl">Create organization</h1>
          <h2 className="text-muted-foreground text-sm text-pretty">
            Create a new organization to get started. You can change the name
            later in organization settings.
          </h2>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name</FormLabel>
                <FormControl>
                  <Input placeholder="Apple Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={createOrganization.isPending}
          >
            Create organization
          </Button>
        </div>
      </form>
    </Form>
  );
}
