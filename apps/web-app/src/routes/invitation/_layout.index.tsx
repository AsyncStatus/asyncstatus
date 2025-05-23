import { sessionQueryOptions } from "@/rpc/auth";
import {
  acceptInvitationMutationOptions,
  getInvitationByEmailQueryOptions,
  getInvitationQueryOptions,
  rejectInvitationMutationOptions,
} from "@/rpc/organization/organization";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@asyncstatus/ui/components/avatar";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import { toast } from "@asyncstatus/ui/components/sonner";
import { Mail, User } from "@asyncstatus/ui/icons";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { getFileUrl, getInitials } from "@/lib/utils";

export const Route = createFileRoute("/invitation/_layout/")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient }, search, location }) => {
    const [session, invitation] = await Promise.all([
      queryClient.ensureQueryData(sessionQueryOptions()).catch(() => {}),
      queryClient.ensureQueryData(
        getInvitationByEmailQueryOptions(
          search.invitationId,
          search.invitationEmail,
          false,
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
  const invitation = useSuspenseQuery(
    getInvitationByEmailQueryOptions(
      search.invitationId,
      search.invitationEmail,
      true,
    ),
  );
  const acceptInvitation = useMutation({
    ...acceptInvitationMutationOptions(),
    onSuccess() {
      toast.success("Invitation accepted successfully!");
      navigate({
        to: "/$organizationSlug",
        params: { organizationSlug: invitation.data!.organization.slug },
        replace: true,
      });
      queryClient.invalidateQueries({
        queryKey: getInvitationQueryOptions(
          search.invitationId,
          search.invitationEmail,
        ).queryKey,
      });
    },
  });
  const rejectInvitation = useMutation({
    ...rejectInvitationMutationOptions(),
    onSuccess() {
      toast.success("Invitation rejected");
      queryClient.invalidateQueries({
        queryKey: getInvitationQueryOptions(
          search.invitationId,
          search.invitationEmail,
        ).queryKey,
      });
    },
  });

  const { data } = invitation;

  // Get organization avatar URL if logo exists
  const organizationAvatarUrl =
    data?.organization.logo && data.organization.slug
      ? getFileUrl({
          param: { idOrSlug: data.organization.slug },
          query: { fileKey: data.organization.logo },
        })
      : null;

  return (
    <Card className="w-full max-w-lg pb-0">
      <CardHeader>
        <div className="flex flex-col items-center justify-center space-x-4">
          <Avatar className="size-24 border">
            {organizationAvatarUrl ? (
              <AvatarImage
                src={organizationAvatarUrl}
                alt={data?.organization.name || "Organization"}
              />
            ) : (
              <AvatarFallback className="text-lg font-medium">
                {getInitials(data?.organization.name || "Organization")}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="mt-4 text-center">
            <CardTitle className="text-xl">{data?.organization.name}</CardTitle>
            <CardDescription>
              Join {data?.organization.name} to start collaborating with the
              team.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <User className="text-primary size-5" />
            <div>
              <div className="text-muted-foreground text-sm">Invited by</div>
              <span className="font-medium">{data?.inviter.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="text-primary size-5" />
            <div>
              <div className="text-muted-foreground text-sm">
                Invitation sent to
              </div>
              <span className="font-medium">{data?.name} </span>
              <span className="text-muted-foreground text-sm">
                {data?.email}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{data?.role}</span>
            </div>

            {data?.team && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Team:</span>
                <span className="font-medium capitalize">
                  {data?.team.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {data?.status === "pending" && (
        <CardFooter className="bg-muted/20 border-t pb-3.5">
          <div className="flex w-full gap-2">
            <Button
              className="flex-1"
              onClick={() =>
                acceptInvitation.mutate({ id: search.invitationId })
              }
              disabled={acceptInvitation.isPending}
            >
              {acceptInvitation.isPending ? "Accepting..." : "Accept"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                rejectInvitation.mutate({ id: search.invitationId })
              }
              disabled={rejectInvitation.isPending}
            >
              {rejectInvitation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
