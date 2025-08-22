import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import type { Db } from "../../db/db";
import * as schema from "../../db";

const InputSchema = z.object({
  eventId: z.string().describe("The Figma event ID"),
});

const OutputSchema = z.object({
  event: z
    .object({
      id: z.string(),
      figmaId: z.string(),
      type: z.string(),
      timestamp: z.string(),
      payload: z.any(),
      file: z
        .object({
          id: z.string(),
          fileKey: z.string(),
          name: z.string(),
          fileType: z.enum(["design", "figjam", "dev_mode"]),
          thumbnailUrl: z.string().nullable(),
        })
        .nullable(),
      user: z
        .object({
          id: z.string(),
          figmaId: z.string(),
          handle: z.string(),
          email: z.string().nullable(),
          name: z.string().nullable(),
        })
        .nullable(),
      summary: z.string().nullable(),
    })
    .nullable()
    .describe("The detailed Figma event information, or null if not found"),
});

export const getFigmaEventDetailTool = ({ db }: { db: Db }) => ({
  name: "get_figma_event_detail",
  description: "Get detailed information about a specific Figma event",
  parameters: InputSchema,
  execute: async (input: z.infer<typeof InputSchema>) => {
    const event = await db.query.figmaEvent.findFirst({
      where: eq(schema.figmaEvent.id, input.eventId),
      with: {
        file: true,
        vectors: true,
      },
    });

    if (!event) {
      return { event: null };
    }

    // Try to find the user
    let user = null;
    if (event.figmaUserId) {
      const figmaUser = await db.query.figmaUser.findFirst({
        where: eq(schema.figmaUser.figmaId, event.figmaUserId),
      });
      if (figmaUser) {
        user = {
          id: figmaUser.id,
          figmaId: figmaUser.figmaId,
          handle: figmaUser.handle,
          email: figmaUser.email,
          name: figmaUser.name,
        };
      }
    }

    return {
      event: {
        id: event.id,
        figmaId: event.figmaId,
        type: event.type,
        timestamp: event.timestamp,
        payload: event.payload,
        file: event.file
          ? {
              id: event.file.id,
              fileKey: event.file.fileKey,
              name: event.file.name,
              fileType: event.file.fileType as "design" | "figjam" | "dev_mode",
              thumbnailUrl: event.file.thumbnailUrl,
            }
          : null,
        user,
        summary: event.vectors[0]?.embeddingText || null,
      },
    };
  },
});