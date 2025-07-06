import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { toast } from "@asyncstatus/ui/components/sonner";
import { ChevronLeft } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { forgotPasswordMutationOptions } from "@/rpc/auth";

export const Route = createFileRoute("/(auth)/_layout/forgot-password")({
  component: RouteComponent,
});

const schema = z.object({
  email: z.string().email(),
});

function RouteComponent() {
  const search = Route.useSearch();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const forgotPassword = useMutation({
    ...forgotPasswordMutationOptions(),
    onSuccess() {
      toast.success("Email sent", {
        description: "We've sent you a link to reset your password. Please check your email.",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        className="mx-auto w-full max-w-xs space-y-24"
        onSubmit={form.handleSubmit((data) => {
          forgotPassword.mutate({
            ...data,
            redirectTo: `${import.meta.env.VITE_WEB_APP_URL}/reset-password`,
          });
        })}
      >
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl">Forgot your password?</h1>
          <h2 className="text-muted-foreground text-sm text-balance">
            Enter your email and we will send you a link to reset your password.
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
                  <Input placeholder="john.doe@example.com" autoComplete="work email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-2">
            {forgotPassword.error && (
              <div className="text-destructive text-sm text-pretty">
                {forgotPassword.error.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
              Reset password
            </Button>

            <Button asChild variant="ghost" className="text-muted-foreground gap-0.5">
              <Link to="/login" search={search}>
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
