import { mutationOptions } from "@/lib/utils";

import { rpc } from "../rpc";

export function generateStatusMutationOptions() {
  return mutationOptions({
    mutationKey: ["statusUpdate", "generate"],
    mutationFn: async ({
      param,
      form,
    }: {
      param: { idOrSlug: string };
      form: {
        memberId: string;
        effectiveFrom: string | Date;
        effectiveTo: string | Date;
      };
    }) => {
      const response = await rpc.organization[":idOrSlug"][
        "status-update"
      ].generate.$post({
        param,
        json: {
          memberId: form.memberId,
          effectiveFrom:
            typeof form.effectiveFrom === "string"
              ? new Date(form.effectiveFrom)
              : form.effectiveFrom,
          effectiveTo:
            typeof form.effectiveTo === "string"
              ? new Date(form.effectiveTo)
              : form.effectiveTo,
        },
      });
      if (!response.ok) {
        throw await response.json();
      }
      return response.json();
    },
  });
}
