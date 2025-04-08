"use client";

import * as React from "react";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@asyncstatus/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@asyncstatus/ui/components/form";
import { Input } from "@asyncstatus/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

interface WaitlistDialogProps {
  buttonSize?: "default" | "lg" | "sm";
  className?: string;
}

export function WaitlistDialog({
  buttonSize = "default",
  className,
}: WaitlistDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/waitlist`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      },
    );
    setIsLoading(false);
    if (response.status === 429) {
      const retryAfterSeconds =
        Number(response.headers.get("ratelimit-reset")) || 0;
      const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
      setError(
        retryAfterMinutes < 1
          ? "Too many attempts, please try again in a moment."
          : `Too many attempts, please try again in ${retryAfterMinutes} minute(s).`,
      );
      return;
    }
    if (!response.ok) {
      posthog.capture("waitlist_dialog_error");
      setError("Failed to join waitlist, please try again later.");
      return;
    }
    const json = await response.json();

    if (json.ok) {
      setError(null);
      setIsSuccess(true);
      posthog.capture("waitlist_dialog_success");
    } else {
      setError("Failed to join waitlist, please try again later.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={buttonSize}
          className={className}
          onClick={() => {
            posthog.capture("waitlist_dialog_open");
          }}
        >
          Join waitlist
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden border-none pb-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Join waitlist</DialogTitle>
          <DialogDescription className="text-balance">
            Be among the first to use AsyncStatus when we launch.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 max-sm:py-8">
          {isSuccess ? (
            <div className="py-24 pt-20 text-center">
              <h4 className="text-2xl font-medium">
                Thank you for joining the waitlist!
              </h4>
              <p className="text-muted-foreground mt-1 text-base">
                We'll send you an email when we're ready to have you.
              </p>

              <Button asChild className="mt-4">
                <DialogClose
                  onClick={() => {
                    setIsSuccess(false);
                    setError(null);
                    form.reset();
                    posthog.capture("waitlist_dialog_close_success");
                  }}
                >
                  Close
                </DialogClose>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@company.com"
                          type="email"
                          autoComplete="work email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Join waitlist
                </Button>
              </form>
            </Form>
          )}
        </div>

        <div className="bg-primary -mx-6 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-primary-foreground text-lg font-medium">
                Skip the line for $5
              </h4>
              <p className="text-primary-foreground/60 text-sm">
                No waiting, just access to beta.
                <br />
                Discounts and priority support included.
              </p>
            </div>
            <Button
              asChild
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <a href={process.env.NEXT_PUBLIC_STRIPE_LINK} target="_blank">
                Go to stripe →
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
