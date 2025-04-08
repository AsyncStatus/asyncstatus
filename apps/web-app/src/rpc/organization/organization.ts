import {
  zOrganizationCreate,
  zOrganizationCreateInvite,
  zOrganizationIdOrSlug,
  zOrganizationMemberId,
} from "@asyncstatus/api/schema/organization";
import { queryOptions, skipToken } from "@tanstack/react-query";
import type { z } from "zod";

import { authClient } from "@/lib/auth";
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
      const { data, error } = await authClient.organization.getActiveMember();
      if (error) {
        throw new Error(error.message);
      }
      return data;
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
        throw await response.json();
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
      const response = await rpc.organization[
        ":idOrSlug"
      ].members.invitations.$post({ param: data.param, json: data.json });
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

export function acceptInvitationMutationOptions() {
  return mutationOptions({
    mutationKey: ["acceptInvitation"],
    mutationFn: async (
      input: Parameters<typeof authClient.organization.acceptInvitation>[0],
    ) => {
      const res = await authClient.organization.acceptInvitation(input);
      if (res.error) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
  });
}

export function rejectInvitationMutationOptions() {
  return mutationOptions({
    mutationKey: ["rejectInvitation"],
    mutationFn: async (
      input: Parameters<typeof authClient.organization.rejectInvitation>[0],
    ) => {
      const res = await authClient.organization.rejectInvitation(input);
      if (res.error) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
  });
}
export function getInvitationQueryOptions(invitationId: string) {
  return queryOptions({
    queryKey: ["invitation", invitationId],
    queryFn: async () => {
      const response = await authClient.organization.getInvitation({
        query: { id: invitationId },
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
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
    enabled: !!invitationId && !!email,
  });
}

export function getMemberQueryOptions(
  param: z.infer<typeof zOrganizationIdOrSlug> &
    z.infer<typeof zOrganizationMemberId>,
) {
  return queryOptions({
    queryKey: ["member", param.idOrSlug, param.memberId],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"].members[
        ":memberId"
      ].$get({ param });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function updateMemberMutationOptions() {
  return mutationOptions({
    mutationKey: ["updateMember"],
    mutationFn: async (
      input: Parameters<
        (typeof rpc.organization)[":idOrSlug"]["members"][":memberId"]["$patch"]
      >[0],
    ) => {
      const response =
        await rpc.organization[":idOrSlug"].members[":memberId"].$patch(input);
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function updateOrganizationMutationOptions() {
  return mutationOptions({
    mutationKey: ["updateOrganization"],
    mutationFn: async (
      input: Parameters<(typeof rpc.organization)[":idOrSlug"]["$patch"]>[0],
    ) => {
      const response = await rpc.organization[":idOrSlug"].$patch(input);
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}
