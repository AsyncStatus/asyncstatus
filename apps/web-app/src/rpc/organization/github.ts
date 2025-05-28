import { queryOptions } from "@tanstack/react-query";

import { mutationOptions } from "@/lib/utils";

import { rpc } from "../rpc";

/**
 * Get GitHub integration for an organization
 */
export function getGithubIntegrationQueryOptions(organizationSlug: string) {
  return queryOptions({
    queryKey: ["organization", organizationSlug, "github"],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"].github.$get({
        param: { idOrSlug: organizationSlug },
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

/**
 * Disconnect GitHub from an organization
 */
export function disconnectGithubMutationOptions() {
  return mutationOptions({
    mutationKey: ["organization", "github", "disconnect"],
    mutationFn: async ({ param }: { param: { idOrSlug: string } }) => {
      const response = await rpc.organization[":idOrSlug"].github.$delete({
        param,
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}
