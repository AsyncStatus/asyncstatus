import { queryOptions, skipToken } from "@tanstack/react-query";

import { authClient } from "@/lib/auth";
import { mutationOptions } from "@/lib/utils";

import { rpc } from "./rpc";

export function getOrganizationQueryOptions(idOrSlug?: string) {
  return queryOptions({
    queryKey: ["organization", idOrSlug],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"].$get({
        param: { idOrSlug: idOrSlug! },
      });
      return response.json();
    },
    enabled: !!idOrSlug,
  });
}

export function createOrganizationMutationOptions() {
  return mutationOptions({
    mutationKey: ["createOrganization"],
    mutationFn: async (
      input: Parameters<typeof authClient.organization.create>[0],
    ) => {
      const { data, error } = await authClient.organization.create(input);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function createOrganizationAndSetActiveMutationOptions() {
  return mutationOptions({
    mutationKey: ["createOrganizationAndSetActive"],
    mutationFn: async (
      input: Parameters<typeof authClient.organization.create>[0],
    ) => {
      const { data, error } = await authClient.organization.create(input);
      if (error) {
        throw new Error(error.message);
      }
      const { data: activeData, error: activeError } =
        await authClient.organization.setActive({
          organizationId: data.id,
        });
      if (activeError) {
        throw new Error(activeError.message);
      }
      return activeData;
    },
  });
}

export function listOrganizationsQueryOptions() {
  return queryOptions({
    queryKey: ["organizations"],
    queryFn: async ({ signal }) => {
      const { data, error } = await authClient.organization.list({
        fetchOptions: { signal },
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function checkOrganizationSlugQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ["checkOrganizationSlug", slug],
    throwOnError: false,
    queryFn: slug
      ? async ({ signal }) => {
          const { data, error } = await authClient.organization.checkSlug({
            slug,
            fetchOptions: { signal },
          });
          if (error) {
            throw new Error(error.message);
          }
          return data;
        }
      : skipToken,
  });
}

export function setActiveOrganizationMutationOptions() {
  return mutationOptions({
    mutationKey: ["setActiveOrganization"],
    mutationFn: async (
      input: Parameters<typeof authClient.organization.setActive>[0],
    ) => {
      const { data, error } = await authClient.organization.setActive(input);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}
