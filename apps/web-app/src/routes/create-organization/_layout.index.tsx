import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import {
  listMemberOrganizationsContract,
  setActiveOrganizationContract,
} from "@asyncstatus/api/typed-handlers/organization";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { ArrowRight } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { CreateOrganizationForm } from "@/components/create-organization-form";
import { getInitials } from "@/lib/utils";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";

export const Route = createFileRoute("/create-organization/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const memberOrganizations = useQuery(
    typedQueryOptions(listMemberOrganizationsContract, {}, { throwOnError: false }),
  );
  const session = useQuery(sessionBetterAuthQueryOptions());
  const sortedMemberOrganizations = useMemo(() => {
    return memberOrganizations.data?.sort(
      (a) =>
        (session.data?.session.activeOrganizationSlug === a.organization.slug ? -1 : 1) ||
        a.organization.createdAt.getTime(),
    );
  }, [memberOrganizations.data]);
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
    <div className="mx-auto w-full max-w-sm space-y-10">
      <CreateOrganizationForm
        onSuccess={(data) => {
          navigate({
            to: "/$organizationSlug",
            params: { organizationSlug: data.organization.slug },
          });
        }}
      />

      {sortedMemberOrganizations?.length > 0 && (
        <div className="flex flex-col gap-2 border border-border rounded-lg p-2">
          <div className="p-2">
            <p className="text-lg font-medium">Your organizations</p>
            <p className="text-sm text-muted-foreground">
              You have access to {sortedMemberOrganizations?.length} organization
              {sortedMemberOrganizations?.length === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="flex flex-col">
            {sortedMemberOrganizations?.map((organization) => (
              <Link
                to="/$organizationSlug"
                params={{ organizationSlug: organization.organization.slug }}
                className="flex items-center justify-between gap-2 hover:bg-accent rounded-md p-2"
                onClick={() => {
                  setActiveOrganization.mutate({
                    idOrSlug: organization.organization.slug,
                  });
                }}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarImage
                      src={typedUrl(getFileContract, {
                        idOrSlug: organization.organization.slug,
                        // biome-ignore lint/style/noNonNullAssertion: nulls are handled by avatar fallback
                        fileKey: organization.organization.logo!,
                      })}
                    />
                    <AvatarFallback className="text-[0.65rem]">
                      {getInitials(organization.organization.name)}
                    </AvatarFallback>
                  </Avatar>

                  <span className="text-sm font-medium">{organization.organization.name}</span>
                </div>

                <ArrowRight className="size-4" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
