import { queryOptions } from "@tanstack/react-query";
import { mutationOptions } from "@/lib/utils";
import { rpc } from "../rpc";

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
