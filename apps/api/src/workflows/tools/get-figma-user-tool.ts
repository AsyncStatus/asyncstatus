import { z } from "zod/v4";
import { eq, desc } from "drizzle-orm";
import type { Db } from "../../db/db";
import * as schema from "../../db";

const InputSchema = z.object({
  figmaUserId: z.string().describe("The Figma user ID"),
  organizationId: z.string().optional().describe("Optional organization ID to scope the search"),
});

const OutputSchema = z.object({
  user: z
    .object({
      id: z.string(),
      figmaId: z.string(),
      handle: z.string(),
      email: z.string().nullable(),
      name: z.string().nullable(),
      imgUrl: z.string().nullable(),
      recentActivity: z.array(
        z.object({
          eventId: z.string(),
          type: z.string(),
          timestamp: z.string(),
          fileName: z.string().nullable(),
        })
      ),
    })
    .nullable()
    .describe("The Figma user details, or null if not found"),
});

export const getFigmaUserTool = ({ db }: { db: Db }) => ({
  name: "get_figma_user",
  description: "Get details about a specific Figma user",
  parameters: InputSchema,
  execute: async (input: z.infer<typeof InputSchema>) => {
    let query = db.query.figmaUser.findFirst({
      where: eq(schema.figmaUser.figmaId, input.figmaUserId),
      with: {
        integration: true,
      },
    });

    const user = await query;

    if (!user) {
      return { user: null };
    }

    // If organization is specified, verify the user belongs to that org
    if (input.organizationId && user.integration.organizationId !== input.organizationId) {
      return { user: null };
    }

    // Get recent activity for this user
    const recentEvents = await db.query.figmaEvent.findMany({
      where: eq(schema.figmaEvent.figmaUserId, user.figmaId),
      orderBy: [desc(schema.figmaEvent.createdAt)],
      limit: 5,
      with: {
        file: true,
      },
    });

    return {
      user: {
        id: user.id,
        figmaId: user.figmaId,
        handle: user.handle,
        email: user.email,
        name: user.name,
        imgUrl: user.imgUrl,
        recentActivity: recentEvents.map((event) => ({
          eventId: event.id,
          type: event.type,
          timestamp: event.timestamp,
          fileName: event.file?.name || null,
        })),
      },
    };
  },
});