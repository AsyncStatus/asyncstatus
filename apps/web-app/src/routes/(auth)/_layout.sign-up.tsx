import { getInvitationContract } from "@asyncstatus/api/typed-handlers/invitation";
import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { toast } from "@asyncstatus/ui/components/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import {
  sendVerificationEmailMutationOptions,
  signUpEmailMutationOptions,
} from "@/better-auth-tanstack-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/(auth)/_layout/sign-up")({
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

    if (invitation?.hasUser) {
      throw redirect({ to: "/login", search });
    }
  },
  head: () => {
    return {
      meta: [{ title: "Sign up - AsyncStatus" }],
    };
  },
});
const schema = z
  .object({
    firstName: z.string().min(1).max(128).trim(),
    lastName: z.string().min(1).max(128).trim(),
    email: z.email(),
    password: z.string().min(8).max(128),
    passwordConfirmation: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Passwords do not match",
  });

function RouteComponent() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
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
      firstName: invitation.data?.name?.split(" ")[0] ?? "",
      lastName: invitation.data?.name?.split(" ")[1] ?? "",
      email: invitation.data?.email ?? "",
      password: "",
      passwordConfirmation: "",
    },
  });

  useEffect(() => {
    if (invitation.data) {
      form.setValue("email", invitation.data.email);
      form.setValue("firstName", invitation.data.name?.split(" ")[0] ?? "");
      form.setValue("lastName", invitation.data.name?.split(" ")[1] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitation.data?.email, invitation.data?.name, form]);

  const signUpEmail = useMutation(signUpEmailMutationOptions());
  const sendVerificationEmail = useMutation({
    ...sendVerificationEmailMutationOptions(),
    onSuccess() {
      toast.success("We've sent you a verification link, please check your email.", {
        position: "top-center",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        className="mx-auto w-full max-w-xs space-y-24"
        onSubmit={form.handleSubmit(async (data) => {
          await signUpEmail.mutateAsync({
            email: data.email ?? invitation.data?.email,
            password: data.password,
            name: `${data.firstName} ${data.lastName}`,
            callbackURL: import.meta.env.VITE_WEB_APP_URL,
          });
          await router.invalidate();
          queryClient.clear();
          navigate({ to: search.redirect ?? "/" });
          if (!invitation.data) {
            await sendVerificationEmail.mutateAsync({
              email: data.email,
              callbackURL: import.meta.env.VITE_WEB_APP_URL,
            });
          }
        })}
      >
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl">Create an account</h1>
          <h2 className="text-muted-foreground text-sm text-balance">
            Already have one?{" "}
            <Link className="underline" to="/login" search={search}>
              Login to your account
            </Link>
            .
          </h2>
        </div>

        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            disabled={Boolean(invitation.data)}
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="********"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="********"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {signUpEmail.error && (
            <div className="text-destructive text-sm text-pretty">{signUpEmail.error.message}</div>
          )}

          <p className="text-muted-foreground text-xs">
            By signing up, you agree to our{" "}
            <a className="underline" href={`${import.meta.env.VITE_MARKETING_APP_URL}/terms`}>
              Terms of Service
            </a>
            ,{" "}
            <a className="underline" href={`${import.meta.env.VITE_MARKETING_APP_URL}/privacy`}>
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              className="underline"
              href={`${import.meta.env.VITE_MARKETING_APP_URL}/acceptable-use`}
            >
              Acceptable Use
            </a>
            .
          </p>
          <Button type="submit" className="w-full" disabled={signUpEmail.isPending}>
            Create an account
          </Button>
        </div>
      </form>
    </Form>
  );
}
