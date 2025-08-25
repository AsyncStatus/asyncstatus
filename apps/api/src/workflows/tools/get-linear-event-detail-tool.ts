import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getLinearEventDetailTool(db: Db) {
  return tool({
    description: `Get detailed information about a specific Linear event by its ID, including payload data, team/project context, etc.`,
    parameters: z.object({
      eventId: z.string().describe("The Linear event ID to get details for"),
    }),
    execute: async (params) => {
      const eventDetail = await db
        .select({
          linearEvent: {
            id: schema.linearEvent.id,
            externalId: schema.linearEvent.externalId,
            type: schema.linearEvent.type,
            action: schema.linearEvent.action,
            payload: schema.linearEvent.payload,
            createdAt: schema.linearEvent.createdAt,
          },
          linearEventVector: { embeddingText: schema.linearEventVector.embeddingText },
          linearTeam: {
            name: schema.linearTeam.name,
            teamId: schema.linearTeam.teamId,
            key: schema.linearTeam.key,
          },
          linearProject: {
            name: schema.linearProject.name,
            projectId: schema.linearProject.projectId,
            key: schema.linearProject.key,
          },
        })
        .from(schema.linearEvent)
        .leftJoin(
          schema.linearEventVector,
          eq(schema.linearEvent.id, schema.linearEventVector.eventId),
        )
        .leftJoin(schema.linearTeam, eq(schema.linearEvent.teamId, schema.linearTeam.teamId))
        .leftJoin(
          schema.linearProject,
          eq(schema.linearEvent.projectId, schema.linearProject.projectId),
        )
        .where(eq(schema.linearEvent.id, params.eventId))
        .limit(1);
      return eventDetail[0] || null;
    },
  });
}
