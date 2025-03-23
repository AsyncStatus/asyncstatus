import { signUpEmailMutationOptions } from "@/rpc/auth";
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
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const Route = createFileRoute("/(auth)/_layout/sign-up")({
  component: RouteComponent,
});

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    passwordConfirmation: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Passwords do not match",
  });

function RouteComponent() {
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", passwordConfirmation: "" },
  });

  const signUpEmail = useMutation({
    ...signUpEmailMutationOptions(),
    onSuccess() {
      toast.success(
        "We've sent you a verification link, please check your email.",
      );
      navigate({ to: "/" });
    },
  });

  return (
    <Form {...form}>
      <form
        className="mx-auto w-full max-w-xs space-y-24"
        onSubmit={form.handleSubmit((data) => {
          signUpEmail.mutate({
            email: data.email,
            password: data.password,
            name: data.email.split("@")[0] ?? data.email,
            callbackURL: `${import.meta.env.VITE_WEB_APP_URL}`,
          });
        })}
      >
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl">Create an account</h1>
          <h2 className="text-muted-foreground text-sm text-balance">
            Already have an account?{" "}
            <Link className="underline" to="/login">
              Login
            </Link>
            .
          </h2>
        </div>

        <div className="grid gap-5">
          <FormField
            control={form.control}
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
            <div className="text-destructive text-sm text-pretty">
              {signUpEmail.error.message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={signUpEmail.isPending}
          >
            Create an account
          </Button>
        </div>
      </form>
    </Form>
  );
}
