import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export function getLinearUserTool(db: Db) {
  return tool({
    description: `Get Linear user details by userId within an organization's integration context`,
    parameters: z.object({
      organizationId: z.string(),
      userId: z.string().describe("The Linear user ID"),
    }),
    execute: async (params) => {
      const rows = await db
        .select({
          linearUser: {
            userId: schema.linearUser.userId,
            email: schema.linearUser.email,
            name: schema.linearUser.name,
            displayName: schema.linearUser.displayName,
            avatarUrl: schema.linearUser.avatarUrl,
          },
        })
        .from(schema.linearUser)
        .innerJoin(
          schema.linearIntegration,
          eq(schema.linearUser.integrationId, schema.linearIntegration.id),
        )
        .where(
          and(
            eq(schema.linearIntegration.organizationId, params.organizationId),
            eq(schema.linearUser.userId, params.userId),
          ),
        )
        .limit(1);
      return rows[0] || null;
    },
  });
}
