import { discordIntegrationCallbackContract } from "@asyncstatus/api/typed-handlers/discord-integration";
import { githubIntegrationCallbackContract } from "@asyncstatus/api/typed-handlers/github-integration";
import { getInvitationContract } from "@asyncstatus/api/typed-handlers/invitation";
import { slackIntegrationCallbackContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import { SiDiscord, SiGithub, SiSlack } from "@asyncstatus/ui/brand-icons";
import { Button } from "@asyncstatus/ui/components/button";
import { Checkbox } from "@asyncstatus/ui/components/checkbox";
import { Input } from "@asyncstatus/ui/components/input";
import { Separator } from "@asyncstatus/ui/components/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import {
  loginEmailMutationOptions,
  loginOauth2MutationOptions,
  loginSocialMutationOptions,
} from "@/better-auth-tanstack-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";

export const Route = createFileRoute("/(auth)/_layout/login")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient }, search }) => {
    if (!search.invitationId) {
      return;
    }

    const invitation = await queryClient.ensureQueryData(
      typedQueryOptions(
        getInvitationContract,
        { id: search.invitationId },
        { throwOnError: false },
      ),
    );
    if (invitation && !invitation?.hasUser) {
      throw redirect({ to: "/sign-up", search });
    }
  },
  head: () => {
    return {
      meta: [{ title: "Login - AsyncStatus" }],
    };
  },
});

const schema = z.object({
  email: z.email(),
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
      search.invitationId ? { id: search.invitationId } : skipToken,
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
      await queryClient.resetQueries();
      await router.invalidate();
      await navigate({ to: search.redirect ?? "/" });
    },
  });

  const loginSocial = useMutation({
    ...loginSocialMutationOptions(),
    async onSuccess() {
      await queryClient.resetQueries();
      await router.invalidate();
      await navigate({ to: search.redirect ?? "/" });
    },
  });

  const loginOauth2 = useMutation({
    ...loginOauth2MutationOptions(),
    async onSuccess() {
      await queryClient.resetQueries();
      await router.invalidate();
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
        className="mx-auto w-full max-w-xs"
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

        <div className="space-y-4 mt-16">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              loginSocial.mutate({
                provider: "github",
                scopes: ["user:email"],
                callbackURL: typedUrl(githubIntegrationCallbackContract, {
                  redirect: search.redirect,
                }),
              })
            }
          >
            <SiGithub className="size-4" />
            Continue with GitHub
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              loginSocial.mutate({
                provider: "slack",
                // scopes: slackScopes,
                // scopes: slackUserScopes,
                callbackURL: typedUrl(slackIntegrationCallbackContract, {
                  redirect: search.redirect,
                }),
              })
            }
          >
            <SiSlack className="size-4" />
            Continue with Slack
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              loginSocial.mutate({
                provider: "discord",
                // scopes: ["user:email"],
                callbackURL: typedUrl(discordIntegrationCallbackContract, {
                  redirect: search.redirect,
                }),
              })
            }
          >
            <SiDiscord className="size-4" />
            Continue with Discord
          </Button>
        </div>

        <div className="relative my-12">
          <Separator />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 text-center text-sm text-muted-foreground bg-background">
            or
          </div>
        </div>

        <div className="grid gap-5 mt-12">
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

const slackScopes = [
  "app_mentions:read",
  "channels:history",
  "channels:join",
  "channels:read",
  "chat:write",
  "chat:write.public",
  "commands",
  "emoji:read",
  "files:read",
  "groups:history",
  "groups:read",
  "im:history",
  "im:read",
  "incoming-webhook",
  "mpim:history",
  "mpim:read",
  "pins:read",
  "reactions:read",
  "team:read",
  "users:read",
  "users.profile:read",
  "users:read.email",
  "calls:read",
  "reminders:read",
  "reminders:write",
  "channels:manage",
  "chat:write.customize",
  "im:write",
  "links:read",
  "metadata.message:read",
  "mpim:write",
  "pins:write",
  "reactions:write",
  "dnd:read",
  "usergroups:read",
  "usergroups:write",
  "users:write",
  "remote_files:read",
  "remote_files:write",
  "files:write",
  "groups:write",
];

const slackUserScopes: string[] = [
  "channels:history",
  "channels:read",
  "dnd:read",
  "emoji:read",
  "files:read",
  "groups:history",
  "groups:read",
  "im:history",
  "im:read",
  "mpim:history",
  "mpim:read",
  "pins:read",
  "reactions:read",
  "team:read",
  "users:read",
  "users.profile:read",
  "users:read.email",
  "calls:read",
  "reminders:read",
  "reminders:write",
  "stars:read",
];
