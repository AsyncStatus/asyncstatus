import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getGitlabEventDetailTool(db: Db) {
  return tool({
    description: "Get full details of a specific GitLab event",
    parameters: z.object({
      eventId: z.string(),
    }),
    execute: async ({ eventId }) => {
      const event = await db.query.gitlabEvent.findFirst({
        where: eq(schema.gitlabEvent.id, eventId),
        with: {
          project: {
            columns: {
              name: true,
              namespace: true,
              pathWithNamespace: true,
              webUrl: true,
              visibility: true,
            },
          },
          vectors: {
            columns: {
              embeddingText: true,
            },
            limit: 1,
          },
        },
      });

      if (!event) {
        return null;
      }

      return {
        id: event.id,
        gitlabId: event.gitlabId,
        type: event.type,
        action: event.action,
        createdAt: event.createdAt,
        payload: event.payload,
        project: event.project,
        embeddingText: event.vectors[0]?.embeddingText || null,
      };
    },
  });
}
