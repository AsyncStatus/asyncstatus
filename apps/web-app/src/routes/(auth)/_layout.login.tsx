import { useEffect } from "react";
import { loginEmailMutationOptions } from "@/rpc/auth";
import { getInvitationByEmailQueryOptions } from "@/rpc/organization/organization";
import { Button } from "@asyncstatus/ui/components/button";
import { Checkbox } from "@asyncstatus/ui/components/checkbox";
import { Input } from "@asyncstatus/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";

export const Route = createFileRoute("/(auth)/_layout/login")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient }, search }) => {
    if (search.invitationId && search.invitationEmail) {
      const data = await queryClient
        .ensureQueryData({
          ...getInvitationByEmailQueryOptions(
            search.invitationId,
            search.invitationEmail,
            false,
          ),
          retry: false,
        })
        .catch(() => {});
      if (data && !data?.hasUser) {
        throw redirect({ to: "/sign-up", search });
      }
    }
  },
});

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().default(false),
});

function RouteComponent() {
  const router = useRouter();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const invitation = useSuspenseQuery(
    getInvitationByEmailQueryOptions(
      search.invitationId,
      search.invitationEmail,
      false,
    ),
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: invitation.data?.email ?? "",
      password: "",
      rememberMe: true,
    },
  });

  const loginEmail = useMutation({
    ...loginEmailMutationOptions(),
    async onSuccess() {
      await router.invalidate();
      queryClient.clear();
      await navigate({ to: search.redirect ?? "/" });
    },
  });

  return (
    <Form {...form}>
      <form
        className="mx-auto w-full max-w-xs space-y-24"
        onSubmit={form.handleSubmit((data) => {
          loginEmail.mutate({
            ...data,
            email: invitation.data?.email ?? data.email,
          });
        })}
      >
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl">Login to your account</h1>
          <h2 className="text-muted-foreground text-sm text-balance">
            Don't have one?{" "}
            <Link className="underline" to="/sign-up" search={search}>
              Create an account
            </Link>
            .
          </h2>
        </div>

        <div className="grid gap-5">
          <FormField
            control={form.control}
            disabled={Boolean(search.invitationEmail)}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john.doe@example.com"
                    autoComplete="work email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-end justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    tabIndex={1}
                    to="/forgot-password"
                    className="text-muted-foreground text-xs hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    autoComplete="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Remember me</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          {loginEmail.error && (
            <div className="text-destructive text-sm text-pretty">
              {loginEmail.error.message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loginEmail.isPending}
          >
            Login
          </Button>
        </div>
      </form>
    </Form>
  );
}
