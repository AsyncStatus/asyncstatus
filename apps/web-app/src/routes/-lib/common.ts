import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import type { QueryClient } from "@tanstack/react-query";
import { type ParsedLocation, redirect } from "@tanstack/react-router";
import { sessionBetterAuthQueryOptions } from "@/rpc/auth";
import { typedQueryOptions } from "@/typed-handlers";

export async function ensureValidSession(queryClient: QueryClient, location: ParsedLocation) {
  const session = await queryClient.fetchQuery(sessionBetterAuthQueryOptions()).catch(() => {});
  if (!session?.session) {
    throw redirect({
      to: location.href.includes("/invitation?invitationId=") ? "/sign-up" : "/login",
      search: location.href === "/" ? undefined : { redirect: location.href },
    });
  }

  return session;
}

export async function ensureNotLoggedIn(queryClient: QueryClient, search: { redirect?: string }) {
  const session = await queryClient.fetchQuery(sessionBetterAuthQueryOptions()).catch(() => {});
  if (session?.session) {
    throw redirect({ to: search.redirect ?? "/" });
  }
}

export async function ensureValidOrganization(
  queryClient: QueryClient,
  organizationIdOrSlug: string,
) {
  const org = await queryClient
    .fetchQuery(
      typedQueryOptions(
        getOrganizationContract,
        { idOrSlug: organizationIdOrSlug },
        { throwOnError: false },
      ),
    )
    .catch(() => {});
  if (!org?.organization.slug) {
    const session = await queryClient.fetchQuery(sessionBetterAuthQueryOptions()).catch(() => {});
    if (
      session?.session.activeOrganizationId &&
      session.session.activeOrganizationId !== org?.organization.id
    ) {
      throw redirect({
        to: "/$organizationSlug",
        params: { organizationSlug: session.session.activeOrganizationId as string },
      });
    }
    throw redirect({ to: "/create-organization" });
  }

  return org;
}
