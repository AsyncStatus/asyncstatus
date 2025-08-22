import { z } from "zod/v4";
import { eq, desc, gte, and } from "drizzle-orm";
import type { Db } from "../../db/db";
import * as schema from "../../db";
import { dayjs } from "@asyncstatus/dayjs";

const InputSchema = z.object({
  organizationId: z.string().describe("The organization ID"),
  startDate: z
    .string()
    .optional()
    .describe("Start date in ISO format (defaults to 7 days ago)"),
  endDate: z.string().optional().describe("End date in ISO format (defaults to now)"),
  eventType: z.string().optional().describe("Filter by event type"),
  limit: z.number().min(1).max(100).default(50).describe("Maximum number of events to return"),
});

const OutputSchema = z.object({
  events: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      timestamp: z.string(),
      fileName: z.string().nullable(),
      fileKey: z.string().nullable(),
      triggeredBy: z.string().nullable(),
      summary: z.string().nullable(),
    })
  ),
});

export const listOrganizationFigmaEventsTool = ({ db }: { db: Db }) => ({
  name: "list_organization_figma_events",
  description: "List recent Figma events for an organization",
  parameters: InputSchema,
  execute: async (input: z.infer<typeof InputSchema>) => {
    const startDate = input.startDate
      ? dayjs(input.startDate).toDate()
      : dayjs().subtract(7, "days").toDate();
    const endDate = input.endDate ? dayjs(input.endDate).toDate() : new Date();

    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, input.organizationId),
      with: {
        teams: {
          with: {
            projects: {
              with: {
                files: {
                  with: {
                    events: {
                      where: and(
                        gte(schema.figmaEvent.createdAt, startDate),
                        input.eventType
                          ? eq(schema.figmaEvent.type, input.eventType)
                          : undefined
                      ),
                      orderBy: [desc(schema.figmaEvent.createdAt)],
                      limit: input.limit,
                      with: {
                        vectors: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!integration) {
      return { events: [] };
    }

    const events = integration.teams.flatMap((team) =>
      team.projects.flatMap((project) =>
        project.files.flatMap((file) =>
          file.events.map((event) => ({
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            fileName: file.name,
            fileKey: file.fileKey,
            triggeredBy: event.figmaUserId,
            summary: event.vectors[0]?.embeddingText || null,
          }))
        )
      )
    );

    return { events: events.slice(0, input.limit) };
  },
});