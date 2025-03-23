import { sessionQueryOptions } from "@/rpc/auth";
import {
  getOrganizationQueryOptions,
  listOrganizationsQueryOptions,
} from "@/rpc/organization";
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

export async function ensureValidSession(queryClient: QueryClient) {
  const session = await queryClient
    .fetchQuery(sessionQueryOptions())
    .catch(() => {});
  if (!session?.session) {
    throw redirect({ to: "/login" });
  }

  return session;
}

export async function ensureNotLoggedIn(queryClient: QueryClient) {
  const session = await queryClient
    .fetchQuery(sessionQueryOptions())
    .catch(() => {});
  if (session?.session) {
    throw redirect({ to: "/" });
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
  if (!org?.slug) {
    const org = await getDefaultOrganization(queryClient);
    throw redirect({
      to: "/$organizationSlug",
      params: { organizationSlug: org.slug },
    });
  }

  return { ...org, slug: org.slug! };
}
