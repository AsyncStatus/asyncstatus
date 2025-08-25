import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export function listOrganizationMembersTool(db: Db) {
  return tool({
    description: `List members for an organization with their memberId, userId, user name and email. Use to map natural language people to IDs.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID to list members for"),
      includeInactive: z.boolean().optional().default(false),
    }),
    execute: async (params) => {
      const rows = await db
        .select({
          member: {
            id: schema.member.id,
            role: schema.member.role,
            createdAt: schema.member.createdAt,
          },
          user: {
            id: schema.user.id,
            name: schema.user.name,
            email: schema.user.email,
          },
        })
        .from(schema.member)
        .innerJoin(schema.user, eq(schema.user.id, schema.member.userId))
        .where(and(eq(schema.member.organizationId, params.organizationId)));

      return rows.map((r) => ({
        memberId: r.member.id,
        userId: r.user.id,
        name: r.user.name,
        email: r.user.email,
        role: r.member.role,
        createdAt: r.member.createdAt,
      }));
    },
  });
}
