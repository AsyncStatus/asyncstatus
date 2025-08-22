import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import type { Db } from "../../db/db";
import * as schema from "../../db";

const InputSchema = z.object({
  organizationId: z.string().describe("The organization ID"),
});

const OutputSchema = z.object({
  integration: z
    .object({
      id: z.string(),
      teamId: z.string(),
      teamName: z.string().nullable(),
      syncStartedAt: z.date().nullable(),
      syncFinishedAt: z.date().nullable(),
      syncError: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
    .nullable()
    .describe("The Figma integration details, or null if not found"),
});

export const getFigmaIntegrationTool = ({
  db,
  openRouterProvider,
}: {
  db: Db;
  openRouterProvider: OpenRouterProvider;
}) => ({
  name: "get_figma_integration",
  description: "Get the Figma integration details for an organization",
  parameters: InputSchema,
  execute: async (input: z.infer<typeof InputSchema>) => {
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, input.organizationId),
    });

    if (!integration) {
      return { integration: null };
    }

    return {
      integration: {
        id: integration.id,
        teamId: integration.teamId,
        teamName: integration.teamName,
        syncStartedAt: integration.syncStartedAt,
        syncFinishedAt: integration.syncFinishedAt,
        syncError: integration.syncError,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
    };
  },
});