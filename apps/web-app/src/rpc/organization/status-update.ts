import type { zOrganizationIdOrSlug } from "@asyncstatus/api/schema/organization";
import type {
  zStatusUpdateCreate,
  zStatusUpdateId,
} from "@asyncstatus/api/schema/statusUpdate";
import { queryOptions } from "@tanstack/react-query";
import type { z } from "zod";

import { mutationOptions } from "@/lib/utils";

import { rpc } from "../rpc";

export function createStatusUpdateMutationOptions() {
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
  });
}

export function getStatusUpdateQueryOptions(
  params: z.infer<typeof zOrganizationIdOrSlug> &
    z.infer<typeof zStatusUpdateId>,
) {
  return queryOptions({
    queryKey: ["statusUpdate", "get", params],
    queryFn: async () => {
      const response = await rpc.organization[":idOrSlug"]["status-update"][
        ":statusUpdateId"
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
