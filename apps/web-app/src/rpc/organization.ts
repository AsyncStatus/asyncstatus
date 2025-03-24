import {
  zOrganizationCreateInvite,
  zOrganizationIdOrSlug,
} from "@asyncstatus/api/schema/organization";
import { queryOptions, skipToken } from "@tanstack/react-query";
import type { z } from "zod";

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

export function getActiveMemberQueryOptions() {
  return queryOptions({
    queryKey: ["activeMember"],
    queryFn: async () => {
      return authClient.organization.getActiveMember();
    },
  });
}

export function listMembersQueryOptions(idOrSlug: string) {
  return queryOptions({
    queryKey: ["members", idOrSlug],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"].members.$get({
        param: { idOrSlug },
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    },
  });
}

export function removeMemberMutationOptions() {
  return mutationOptions({
    mutationKey: ["removeMember"],
    mutationFn: async (
      input: Parameters<typeof authClient.organization.removeMember>[0],
    ) => {
      const { data, error } = await authClient.organization.removeMember(input);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function inviteMemberMutationOptions() {
  return mutationOptions({
    mutationKey: ["inviteMember"],
    mutationFn: async (data: {
      param: z.infer<typeof zOrganizationIdOrSlug>;
      json: z.infer<typeof zOrganizationCreateInvite>;
    }) => {
      const res = await rpc.organization[":idOrSlug"].members.invitations.$post(
        {
          param: data.param,
          json: data.json,
        },
      );
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      return res.json();
    },
  });
}

export function cancelInvitationMutationOptions() {
  return mutationOptions({
    mutationKey: ["cancelInvitation"],
    mutationFn: async (
      input: Parameters<typeof authClient.organization.cancelInvitation>[0],
    ) => {
      const res = await authClient.organization.cancelInvitation(input);
      if (res.error) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
  });
}
