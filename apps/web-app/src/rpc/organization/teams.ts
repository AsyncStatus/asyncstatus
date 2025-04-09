import type {
  zTeamCreate,
  zTeamMemberAdd,
  zTeamMemberRemove,
  zTeamUpdate,
} from "@asyncstatus/api/schema/organization";
import { queryOptions } from "@tanstack/react-query";
import type { z } from "zod";

import { mutationOptions } from "@/lib/utils";

import { rpc } from "../rpc";

export function listTeamsQueryOptions(idOrSlug: string) {
  return queryOptions({
    queryKey: ["teams", idOrSlug],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"].teams.$get({
        param: { idOrSlug },
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function getTeamQueryOptions(idOrSlug: string, teamId: string) {
  return queryOptions({
    queryKey: ["teams", idOrSlug, teamId],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"].teams[
        ":teamId"
      ].$get({
        param: { idOrSlug, teamId },
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function getTeamMembersQueryOptions(idOrSlug: string, teamId: string) {
  return queryOptions({
    queryKey: ["teams", idOrSlug, teamId, "members"],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"].teams[
        ":teamId"
      ].members.$get({ param: { idOrSlug, teamId } });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function createTeamMutationOptions() {
  return mutationOptions({
    mutationKey: ["createTeam"],
    mutationFn: async (
      data: z.infer<typeof zTeamCreate> & { idOrSlug: string },
    ) => {
      const response = await rpc.organization[":idOrSlug"].teams.$post({
        param: { idOrSlug: data.idOrSlug },
        json: data,
      });

      if (!response.ok) {
        throw await response.json();
      }

      return response.json();
    },
  });
}

export function updateTeamMutationOptions() {
  return mutationOptions({
    mutationKey: ["updateTeam"],
    mutationFn: async (
      data: z.infer<typeof zTeamUpdate> & { idOrSlug: string; teamId: string },
    ) => {
      const response = await rpc.organization[":idOrSlug"].teams[
        ":teamId"
      ].$put({
        param: { idOrSlug: data.idOrSlug, teamId: data.teamId },
        json: data,
      });

      if (!response.ok) {
        throw await response.json();
      }

      return response.json();
    },
  });
}

export function deleteTeamMutationOptions() {
  return mutationOptions({
    mutationKey: ["deleteTeam"],
    mutationFn: async (data: { idOrSlug: string; teamId: string }) => {
      const response = await rpc.organization[":idOrSlug"].teams[
        ":teamId"
      ].$delete({
        param: { idOrSlug: data.idOrSlug, teamId: data.teamId },
      });

      if (!response.ok) {
        throw await response.json();
      }

      return response.json();
    },
  });
}

export function addTeamMemberMutationOptions() {
  return mutationOptions({
    mutationKey: ["addTeamMember"],
    mutationFn: async (
      data: z.infer<typeof zTeamMemberAdd> & {
        idOrSlug: string;
        teamId: string;
      },
    ) => {
      const response = await rpc.organization[":idOrSlug"].teams[
        ":teamId"
      ].members.$post({
        param: { idOrSlug: data.idOrSlug, teamId: data.teamId },
        json: { memberId: data.memberId },
      });

      if (!response.ok) {
        throw await response.json();
      }

      return response.json();
    },
  });
}

export function removeTeamMemberMutationOptions() {
  return mutationOptions({
    mutationKey: ["removeTeamMember"],
    mutationFn: async (
      data: z.infer<typeof zTeamMemberRemove> & {
        idOrSlug: string;
        teamId: string;
      },
    ) => {
      const response = await rpc.organization[":idOrSlug"].teams[
        ":teamId"
      ].members[":memberId"].$delete({
        param: {
          idOrSlug: data.idOrSlug,
          teamId: data.teamId,
          memberId: data.memberId,
        },
      });

      if (!response.ok) {
        throw await response.json();
      }

      return response.json();
    },
  });
}
