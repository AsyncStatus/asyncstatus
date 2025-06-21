import type {
  zOrganizationIdOrSlug,
  zOrganizationMemberId,
} from "@asyncstatus/api/schema/organization";
import type {
  zStatusUpdateCreate,
  zStatusUpdateIdOrDate,
  zStatusUpdateMemberSearch,
} from "@asyncstatus/api/schema/statusUpdate";
import { queryOptions, type QueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { mutationOptions } from "@/lib/utils";

import { rpc } from "../rpc";

export function createStatusUpdateMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["statusUpdate", "create"],
    mutationFn: async ({
      param,
      json,
    }: {
      param: { idOrSlug: string };
      json: z.infer<typeof zStatusUpdateCreate>;
    }) => {
      const response = await rpc.organization[":idOrSlug"][
        "status-update"
      ].$post({ param, json });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
    onSuccess: (data, { param }) => {
      queryClient.invalidateQueries({
        queryKey: ["statusUpdate", "get", { idOrSlug: param.idOrSlug }],
      });
    },
  });
}

export function getStatusUpdateQueryOptions(
  params: z.infer<typeof zOrganizationIdOrSlug> &
    z.infer<typeof zStatusUpdateIdOrDate>,
) {
  return queryOptions({
    queryKey: ["statusUpdate", "get", params],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"]["status-update"][
        ":statusUpdateIdOrDate"
      ].$get({
        param: params,
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}

export function getStatusUpdatesByMemberQueryOptions(
  params: z.infer<typeof zOrganizationIdOrSlug> &
    z.infer<typeof zOrganizationMemberId>,
  query?: z.infer<typeof zStatusUpdateMemberSearch>,
) {
  return queryOptions({
    queryKey: ["statusUpdate", "getByMember", params],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"][
        "status-update"
      ].member[":memberId"].$get({ param: params, query: query as any });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
    enabled: !!params.memberId,
  });
}
