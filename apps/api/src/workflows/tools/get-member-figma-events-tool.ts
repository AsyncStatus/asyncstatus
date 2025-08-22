import { z } from "zod/v4";
import { eq, desc, and, gte } from "drizzle-orm";
import type { Db } from "../../db/db";
import * as schema from "../../db";
import { dayjs } from "@asyncstatus/dayjs";

const InputSchema = z.object({
  organizationId: z.string().describe("The organization ID"),
  memberId: z.string().describe("The member ID"),
  startDate: z
    .string()
    .optional()
    .describe("Start date in ISO format (defaults to 7 days ago)"),
  endDate: z.string().optional().describe("End date in ISO format (defaults to now)"),
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
      summary: z.string().nullable(),
    })
  ),
  figmaUser: z
    .object({
      id: z.string(),
      handle: z.string(),
      email: z.string().nullable(),
      name: z.string().nullable(),
    })
    .nullable(),
});

export const getMemberFigmaEventsTool = ({ db }: { db: Db }) => ({
  name: "get_member_figma_events",
  description: "Get Figma events for a specific organization member",
  parameters: InputSchema,
  execute: async (input: z.infer<typeof InputSchema>) => {
    const startDate = input.startDate
      ? dayjs(input.startDate).toDate()
      : dayjs().subtract(7, "days").toDate();

    // First, find the member and their linked accounts
    const member = await db.query.member.findFirst({
      where: and(
        eq(schema.member.id, input.memberId),
        eq(schema.member.organizationId, input.organizationId)
      ),
      with: {
        user: {
          with: {
            accounts: true,
          },
        },
      },
    });

    if (!member) {
      return { events: [], figmaUser: null };
    }

    // Find the Figma user linked to this member
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, input.organizationId),
      with: {
        users: {
          where: member.user.email
            ? eq(schema.figmaUser.email, member.user.email)
            : undefined,
        },
      },
    });

    if (!integration || integration.users.length === 0) {
      return { events: [], figmaUser: null };
    }

    const figmaUser = integration.users[0];
  
  if (!figmaUser) {
    return { events: [], figmaUser: null };
  }

    // Get events for this user
    const events = await db.query.figmaEvent.findMany({
      where: and(
        eq(schema.figmaEvent.figmaUserId, figmaUser.figmaId),
        gte(schema.figmaEvent.createdAt, startDate)
      ),
      orderBy: [desc(schema.figmaEvent.createdAt)],
      limit: input.limit,
      with: {
        file: true,
        vectors: true,
      },
    });

    return {
      events: events.map((event) => ({
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        fileName: event.file?.name || null,
        fileKey: event.file?.fileKey || null,
        summary: event.vectors[0]?.embeddingText || null,
      })),
      figmaUser: {
        id: figmaUser.id,
        handle: figmaUser.handle,
        email: figmaUser.email,
        name: figmaUser.name,
      },
    };
  },
});