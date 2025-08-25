import * as schema from "@asyncstatus/db";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { eq } from "drizzle-orm";
import type { TypedHandlersContext } from "../lib/env";
import { getPublicStatusUpdateContract } from "./public-status-update-contracts";

export const getPublicStatusUpdateHandler = typedHandler<
  TypedHandlersContext,
  typeof getPublicStatusUpdateContract
>(getPublicStatusUpdateContract, async ({ db, input }) => {
  const statusUpdate = await db.query.statusUpdate.findFirst({
    where: eq(schema.statusUpdate.slug, input.slug),
    with: {
      member: { with: { user: true } },
      team: true,
      items: {
        orderBy: (items) => [items.order],
      },
    },
  });

  if (!statusUpdate) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Status update not found",
    });
  }

  return statusUpdate;
});
