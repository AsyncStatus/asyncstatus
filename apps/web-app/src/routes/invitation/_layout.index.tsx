import { sessionQueryOptions, signUpEmailMutationOptions } from "@/rpc/auth";
import {
  acceptInvitationMutationOptions,
  getInvitationByEmailQueryOptions,
  getInvitationQueryOptions,
  rejectInvitationMutationOptions,
} from "@/rpc/organization";
import { Badge } from "@asyncstatus/ui/components/badge";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@asyncstatus/ui/components/form";
import { Input } from "@asyncstatus/ui/components/input";
import { Separator } from "@asyncstatus/ui/components/separator";
import { toast } from "@asyncstatus/ui/components/sonner";
import { Building2, Mail, User } from "@asyncstatus/ui/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const Route = createFileRoute("/invitation/_layout/")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient }, search, location }) => {
    const [session, invitation] = await Promise.all([
      queryClient.ensureQueryData(sessionQueryOptions()).catch(() => {}),
      queryClient.ensureQueryData(
        getInvitationByEmailQueryOptions(
          search.invitationId,
          search.invitationEmail,
        ),
      ),
    ]);
    if (!session && invitation?.hasUser) {
      throw redirect({
        to: "/login",
        search: { ...search, redirect: location.href },
      });
    }

    if (!session && !invitation?.hasUser) {
      throw redirect({
        to: "/sign-up",
        search: { ...search, redirect: location.href },
      });
    }
  },
});

function RouteComponent() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [session, invitation] = useSuspenseQueries({
    queries: [
      sessionQueryOptions(),
      getInvitationByEmailQueryOptions(
        search.invitationId,
        search.invitationEmail,
      ),
    ],
  });
  const acceptInvitation = useMutation({
    ...acceptInvitationMutationOptions(),
    onSuccess() {
      toast.success("Invitation accepted successfully!");
      navigate({
        to: "/$organizationSlug",
        params: { organizationSlug: invitation.data!.organization.slug! },
        replace: true,
      });
      queryClient.invalidateQueries({
        queryKey: getInvitationQueryOptions(search.invitationId).queryKey,
      });
    },
  });
  const rejectInvitation = useMutation({
    ...rejectInvitationMutationOptions(),
    onSuccess() {
      toast.success("Invitation rejected");
      queryClient.invalidateQueries({
        queryKey: getInvitationQueryOptions(search.invitationId).queryKey,
      });
    },
  });

  const { data } = invitation;

  const expiresIn = data?.expiresAt
    ? formatDistanceToNow(data.expiresAt, { addSuffix: true })
    : "N/A";

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="default">Pending</Badge>;
      case "accepted":
        return <Badge variant="secondary">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!session.data?.session) {
    return <SignUp />;
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Organization Invitation</CardTitle>
        <CardDescription>
          You've been invited to join {data?.organization.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="text-muted-foreground size-4" />
            <span className="font-medium">{data?.organization.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="text-muted-foreground size-4" />
            <span className="font-medium">Invited by {data?.inviter.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="text-muted-foreground size-4" />
            <span className="font-medium">{data?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Role:</span>
            <Badge variant="outline" className="capitalize">
              {data?.role}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            {getStatusBadge(data?.status ?? "pending")}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Expires:</span>
            <span>{expiresIn}</span>
          </div>
        </div>

        {data?.status === "pending" && (
          <>
            <Separator />

            <div className="flex gap-4">
              <Button
                className="flex-1"
                onClick={() =>
                  acceptInvitation.mutate({ invitationId: search.invitationId })
                }
                disabled={acceptInvitation.isPending}
              >
                {acceptInvitation.isPending
                  ? "Accepting..."
                  : "Accept Invitation"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  rejectInvitation.mutate({ invitationId: search.invitationId })
                }
                disabled={rejectInvitation.isPending}
              >
                {rejectInvitation.isPending
                  ? "Rejecting..."
                  : "Reject Invitation"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const schema = z
  .object({
    firstName: z.string().min(1).max(128).trim(),
    lastName: z.string().min(1).max(128).trim(),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    passwordConfirmation: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Passwords do not match",
  });

function SignUp() {
  const search = Route.useSearch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const invitation = useSuspenseQuery(
    getInvitationByEmailQueryOptions(
      search.invitationId,
      search.invitationEmail,
    ),
  );
  const signUpEmail = useMutation({
    ...signUpEmailMutationOptions(),
    async onSuccess() {
      await router.invalidate();
      queryClient.invalidateQueries({
        queryKey: getInvitationByEmailQueryOptions(
          search.invitationId,
          search.invitationEmail,
        ).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: sessionQueryOptions().queryKey,
      });
    },
  });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: invitation.data.name?.split(" ")[0] ?? "",
      lastName: invitation.data.name?.split(" ")[1] ?? "",
      email: invitation.data.email,
      password: "",
      passwordConfirmation: "",
    },
  });

  return (
    <Form {...form}>
      <form
        className="mx-auto w-full max-w-xs space-y-24"
        onSubmit={form.handleSubmit(async (data) => {
          await signUpEmail.mutateAsync({
            email: data.email,
            password: data.password,
            name: `${data.firstName} ${data.lastName}`,
            callbackURL: import.meta.env.VITE_WEB_APP_URL,
          });
        })}
      >
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl">Set password</h1>
          <h2 className="text-muted-foreground text-sm text-balance">
            Set a password to accept an invitation.
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
            disabled
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
            Set password
          </Button>
        </div>
      </form>
    </Form>
  );
}
