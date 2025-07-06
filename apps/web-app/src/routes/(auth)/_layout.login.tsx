import { getInvitationContract } from "@asyncstatus/api/typed-handlers/invitation";
import { Button } from "@asyncstatus/ui/components/button";
import { Checkbox } from "@asyncstatus/ui/components/checkbox";
import { Input } from "@asyncstatus/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { loginEmailMutationOptions } from "@/rpc/auth";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/(auth)/_layout/login")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient }, search }) => {
    if (!search.invitationId || !search.invitationEmail) {
      return;
    }

    const invitation = await queryClient.ensureQueryData(
      typedQueryOptions(
        getInvitationContract,
        { id: search.invitationId, email: search.invitationEmail },
        { throwOnError: false },
      ),
    );
    if (invitation && !invitation?.hasUser) {
      throw redirect({ to: "/sign-up", search });
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
  const invitation = useQuery(
    typedQueryOptions(
      getInvitationContract,
      search.invitationId && search.invitationEmail
        ? { id: search.invitationId, email: search.invitationEmail }
        : skipToken,
      { throwOnError: false },
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

  useEffect(() => {
    if (invitation.data?.email) {
      form.setValue("email", invitation.data.email);
    }
  }, [invitation.data?.email]);

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
            disabled={Boolean(search.invitationEmail) && invitation.data?.hasUser}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" autoComplete="work email" {...field} />
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
                    // biome-ignore lint/a11y/noPositiveTabindex: better ux
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
                    autoComplete="current-password"
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
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
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
            <div className="text-destructive text-sm text-pretty">{loginEmail.error.message}</div>
          )}

          <Button type="submit" className="w-full" disabled={loginEmail.isPending}>
            Login
          </Button>
        </div>
      </form>
    </Form>
  );
}
