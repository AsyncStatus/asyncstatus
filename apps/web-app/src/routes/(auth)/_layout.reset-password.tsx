import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { ChevronLeft } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { resetPasswordMutationOptions } from "@/better-auth-tanstack-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";

export const Route = createFileRoute("/(auth)/_layout/reset-password")({
  component: RouteComponent,
  validateSearch: z.object({ token: z.string() }),
  head: () => {
    return {
      meta: [{ title: "Reset password - AsyncStatus" }],
    };
  },
});

const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function RouteComponent() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const resetPassword = useMutation({
    ...resetPasswordMutationOptions(),
    onSuccess() {
      navigate({ to: "/" });
    },
  });

  return (
    <Form {...form}>
      <form
        className="mx-auto w-full max-w-xs space-y-24"
        onSubmit={form.handleSubmit((data) => {
          resetPassword.mutate({ newPassword: data.password, token: token });
        })}
      >
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl">Reset your password</h1>
          <h2 className="text-muted-foreground text-sm text-balance">
            Reset your password to continue using AsyncStatus.
          </h2>
        </div>

        <div className="grid gap-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
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

          <div className="grid gap-2">
            {resetPassword.error && (
              <div className="text-destructive text-sm text-pretty">
                {resetPassword.error.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
              Reset password
            </Button>

            <Button asChild variant="ghost" className="text-muted-foreground gap-0.5">
              <Link to="/login">
                <ChevronLeft />
                Go back to login
              </Link>
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
