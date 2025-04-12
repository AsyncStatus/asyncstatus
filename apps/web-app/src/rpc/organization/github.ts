import type { GithubIntegration } from "@asyncstatus/api/schema/github-integration";
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
 * Connect GitHub to an organization
 */
export function connectGithubMutationOptions() {
  return mutationOptions({
    mutationKey: ["organization", "github", "connect"],
    mutationFn: async ({
      param,
      form,
    }: {
      param: { idOrSlug: string };
      form: { installationId: string };
    }) => {
      const response = await rpc.organization[":idOrSlug"].github.$post({
        param,
        json: form,
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

/**
 * Update GitHub integration for an organization
 */
export function updateGithubIntegrationMutationOptions() {
  return mutationOptions({
    mutationKey: ["organization", "github", "update"],
    mutationFn: async ({
      param,
      form,
    }: {
      param: { idOrSlug: string };
      form: {
        accessToken?: string;
        tokenExpiresAt?: number;
        repositories?: string;
      };
    }) => {
      const response = await rpc.organization[":idOrSlug"].github.$patch({
        param,
        json: form,
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}
