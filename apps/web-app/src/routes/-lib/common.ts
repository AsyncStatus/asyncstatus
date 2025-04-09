import { sessionQueryOptions } from "@/rpc/auth";
import {
  getOrganizationQueryOptions,
  listOrganizationsQueryOptions,
} from "@/rpc/organization/organization";
import type { QueryClient } from "@tanstack/react-query";
import { redirect, type ParsedLocation } from "@tanstack/react-router";

export async function ensureValidSession(
  queryClient: QueryClient,
  location: ParsedLocation,
) {
  const session = await queryClient
    .fetchQuery(sessionQueryOptions())
    .catch(() => {});
  if (!session?.session) {
    throw redirect({
      to: location.href.includes("/invitation?invitationId=")
        ? "/sign-up"
        : "/login",
      search: location.href === "/" ? undefined : { redirect: location.href },
    });
  }

  return session;
}

export async function ensureNotLoggedIn(
  queryClient: QueryClient,
  search: { redirect?: string },
) {
  const session = await queryClient
    .fetchQuery(sessionQueryOptions())
    .catch(() => {});
  if (session?.session) {
    throw redirect({ to: search.redirect ?? "/" });
  }
}
export async function getDefaultOrganization(queryClient: QueryClient) {
  const orgs = await queryClient
    .fetchQuery(listOrganizationsQueryOptions())
    .catch(() => {});
  if (!orgs || orgs.length === 0 || !orgs[0]) {
    throw redirect({ to: "/create-organization" });
  }

  return orgs[0];
}

export async function ensureValidOrganization(
  organizationIdOrSlug: string,
  queryClient: QueryClient,
) {
  const org = await queryClient
    .fetchQuery(getOrganizationQueryOptions(organizationIdOrSlug))
    .catch(() => {});
  if (!org?.organization.slug) {
    const org = await getDefaultOrganization(queryClient);
    throw redirect({
      to: "/$organizationSlug",
      params: { organizationSlug: org.slug },
    });
  }

  return org;
}
