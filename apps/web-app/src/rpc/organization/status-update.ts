import type { zStatusUpdateCreate } from "@asyncstatus/api/schema/statusUpdate";
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
