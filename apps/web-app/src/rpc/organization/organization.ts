import type {
  zOrganizationCreate,
  zOrganizationIdOrSlug,
} from "@asyncstatus/api/schema/organization";
import { queryOptions } from "@tanstack/react-query";
import type { z } from "zod/v4";
import { mutationOptions } from "@/lib/utils";
import { rpc } from "../rpc";

export function getOrganizationQueryOptions(idOrSlug?: string) {
  return queryOptions({
    queryKey: ["organization", idOrSlug],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"].$get({
        param: { idOrSlug: idOrSlug! },
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
    enabled: !!idOrSlug,
  });
}

export function createOrganizationMutationOptions() {
  return mutationOptions({
    mutationKey: ["createOrganization"],
    mutationFn: async (data: z.infer<typeof zOrganizationCreate>) => {
      const response = await rpc.organization.$post({ form: data });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function listOrganizationsQueryOptions() {
  return queryOptions({
    queryKey: ["organizations"],
    staleTime: 10 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const response = await rpc.organization.$get({
        fetchOptions: { signal },
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function setActiveOrganizationMutationOptions() {
  return mutationOptions({
    mutationKey: ["setActiveOrganization"],
    mutationFn: async (param: z.infer<typeof zOrganizationIdOrSlug>) => {
      const response = await rpc.organization[":idOrSlug"]["set-active"].$patch({ param });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function cancelInvitationMutationOptions() {
  return mutationOptions({
    mutationKey: ["cancelInvitation"],
    mutationFn: async (param: { id: string }) => {
      const response = await rpc.invitation[":id"].cancel.$patch({
        param,
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function acceptInvitationMutationOptions() {
  return mutationOptions({
    mutationKey: ["acceptInvitation"],
    mutationFn: async (param: { id: string }) => {
      const response = await rpc.invitation[":id"].accept.$patch({
        param,
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function rejectInvitationMutationOptions() {
  return mutationOptions({
    mutationKey: ["rejectInvitation"],
    mutationFn: async (param: { id: string }) => {
      const response = await rpc.invitation[":id"].reject.$patch({
        param,
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function getInvitationQueryOptions(invitationId: string, email: string) {
  return queryOptions({
    queryKey: ["invitation", invitationId, email],
    queryFn: async () => {
      const response = await rpc.invitation[":id"].$get({
        param: { id: invitationId },
        query: { email },
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function getInvitationByEmailQueryOptions(
  invitationId?: string,
  email?: string,
  throwOnError = true,
) {
  return queryOptions({
    queryKey: ["invitation", invitationId, email],
    queryFn: async () => {
      const response = await rpc.invitation[":id"].$get({
        param: { id: invitationId! },
        query: { email: email! },
      });
      if (response.status === 404 && !throwOnError) {
        return null;
      }
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
    enabled: Boolean(invitationId) && Boolean(email),
  });
}
