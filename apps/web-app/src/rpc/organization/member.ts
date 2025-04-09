import type {
  zOrganizationCreateInvite,
  zOrganizationIdOrSlug,
  zOrganizationMemberId,
} from "@asyncstatus/api/schema/organization";
import { queryOptions } from "@tanstack/react-query";
import type { z } from "zod";

import { mutationOptions } from "@/lib/utils";

import { rpc } from "../rpc";

export function getActiveMemberQueryOptions() {
  return queryOptions({
    queryKey: ["activeMember"],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"].$get({
        param: { idOrSlug: "active" },
      });
      if (!response.ok) {
        throw await response.json();
      }
      const data = await response.json();
      return data.member;
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
