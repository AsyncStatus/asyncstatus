import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import {
  acceptInvitationContract,
  getInvitationContract,
  listUserInvitationsContract,
  rejectInvitationContract,
} from "@asyncstatus/api/typed-handlers/invitation";
import {
  listMemberOrganizationsContract,
  setActiveOrganizationContract,
} from "@asyncstatus/api/typed-handlers/organization";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { getInitials } from "@/lib/utils";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";

export const Route = createFileRoute("/invitations/_layout/")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient }, location, search }) => {
    const [session, invitation] = await Promise.all([
      queryClient.ensureQueryData(sessionBetterAuthQueryOptions()).catch(() => {}),
      queryClient.ensureQueryData(
        typedQueryOptions(
          getInvitationContract,
          { id: search.invitationId ?? "", email: search.invitationEmail ?? "" },
          { throwOnError: false },
        ),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(listMemberOrganizationsContract, {}, { throwOnError: false }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(listUserInvitationsContract, {}, { throwOnError: false }),
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
  const invitations = useQuery(
    typedQueryOptions(
      listUserInvitationsContract,
      {},
      {
        select: (data: any) => {
          return data.sort((a: any, b: any) => {
            if (a.id === search.invitationId) return -1;
            if (b.id === search.invitationId) return 1;
            return 0;
          });
        },
      },
    ),
  );
  const router = useRouter();
  const organizations = useQuery(typedQueryOptions(listMemberOrganizationsContract, {}));
  const acceptInvitation = useMutation(
    typedMutationOptions(acceptInvitationContract, {
      async onSuccess(data) {
        toast.success("Invitation accepted successfully!");
        await router.invalidate();
        await queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getInvitationContract, {} as any).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listUserInvitationsContract, {}).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listMemberOrganizationsContract, {}).queryKey,
        });
        queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            session: { ...sessionData.session, activeOrganizationSlug: data.organization.slug },
          };
        });
        await navigate({
          to: "/$organizationSlug",
          params: { organizationSlug: data.organization.slug },
          replace: true,
        });
      },
    }),
  );
  const rejectInvitation = useMutation(
    typedMutationOptions(rejectInvitationContract, {
      onSuccess() {
        toast.success("Invitation rejected");
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getInvitationContract, {} as any).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listUserInvitationsContract, {}).queryKey,
        });
      },
    }),
  );
  const setActiveOrganization = useMutation(
    typedMutationOptions(setActiveOrganizationContract, {
      onMutate(data) {
        if (!(data instanceof FormData)) {
          navigate({
            to: "/$organizationSlug",
            params: { organizationSlug: data.idOrSlug },
          });
        }
      },
      onSuccess(data) {
        queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            session: { ...sessionData.session, activeOrganizationSlug: data.slug },
          };
        });
      },
    }),
  );

  return (
    <div className="flex flex-col gap-4 w-full items-center pb-16">
      {organizations.data?.length > 0 && (
        <Card className="mt-4 w-full max-w-lg max-sm:max-w-full">
          <CardHeader>
            <CardTitle>Your organizations</CardTitle>
            <CardDescription>
              You are already a member of the following organizations
            </CardDescription>
            <CardContent className="px-0 pt-4">
              <div className="flex flex-col gap-2">
                {organizations.data?.map((organization) => (
                  <Link
                    key={organization.organization.id}
                    to="/$organizationSlug"
                    params={{ organizationSlug: organization.organization.slug }}
                    className="text-sm text-muted-foreground hover:underline flex items-center gap-2"
                    onClick={() =>
                      setActiveOrganization.mutate({ idOrSlug: organization.organization.slug })
                    }
                  >
                    <Avatar className="size-8">
                      <AvatarImage
                        src={typedUrl(getFileContract, {
                          idOrSlug: organization.organization.slug,
                          fileKey: organization.organization.logo ?? "",
                        })}
                        alt={organization.organization.name}
                      />
                      <AvatarFallback>{getInitials(organization.organization.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{organization.organization.name}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </CardHeader>
        </Card>
      )}

      {invitations.data?.map((invitation) => (
        <Card className="w-full max-w-lg pb-0 max-sm:max-w-full" key={invitation.id}>
          <CardHeader>
            <div className="flex flex-col items-center justify-center space-x-4">
              <div className="mt-4 text-center">
                <CardTitle className="text-2xl">{invitation.organization.name}</CardTitle>
                <CardDescription>
                  Join {invitation.organization.name} to start collaborating with the team.
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
                  <span className="font-medium">{invitation.inviter.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-primary size-5" />
                <div>
                  <div className="text-muted-foreground text-sm">Invitation sent to</div>
                  <span className="font-medium">{invitation.name} </span>
                  <span className="text-muted-foreground text-sm">{invitation.email}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium capitalize">{invitation.role}</span>
                </div>

                {invitation.team && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Team:</span>
                    <span className="font-medium capitalize">{invitation.team.name}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          {invitation.status === "pending" && (
            <CardFooter className="bg-muted/20 border-t pb-3.5">
              <div className="flex w-full gap-2">
                <Button
                  className="flex-1"
                  onClick={() => acceptInvitation.mutate({ id: invitation.id })}
                  disabled={acceptInvitation.isPending}
                >
                  {acceptInvitation.isPending ? "Accepting..." : "Accept"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => rejectInvitation.mutate({ id: invitation.id })}
                  disabled={rejectInvitation.isPending}
                >
                  {rejectInvitation.isPending ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
