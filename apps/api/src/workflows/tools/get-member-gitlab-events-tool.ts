import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod/v4";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getMemberGitlabEventsTool(db: Db) {
  return tool({
    description: "Retrieves GitLab events for a member",
    parameters: z.object({
      organizationId: z.string(),
      memberId: z.string(),
      effectiveFrom: z.string(),
      effectiveTo: z.string(),
      projectIds: z.array(z.string()).optional(),
    }) as any,
    execute: async ({ organizationId, memberId, effectiveFrom, effectiveTo, projectIds }) => {
      // Get member's GitLab ID
      const member = await db.query.member.findFirst({
        where: and(
          eq(schema.member.id, memberId),
          eq(schema.member.organizationId, organizationId)
        ),
        columns: { gitlabId: true },
      });

      if (!member?.gitlabId) {
        return [];
      }

      // Get GitLab integration for this organization
      const integration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.organizationId, organizationId),
        columns: { id: true },
      });

      if (!integration) {
        return [];
      }

      // Build query conditions
      const conditions = [
        eq(schema.gitlabEvent.gitlabActorId, member.gitlabId),
        gte(schema.gitlabEvent.createdAt, new Date(effectiveFrom)),
        lte(schema.gitlabEvent.createdAt, new Date(effectiveTo)),
      ];

      // Add project filter if specified
      if (projectIds && projectIds.length > 0) {
        // First get the GitLab project IDs that match the provided project IDs
        const matchingProjects = await db
          .select({ id: schema.gitlabProject.id })
          .from(schema.gitlabProject)
          .where(and(
            eq(schema.gitlabProject.integrationId, integration.id),
            inArray(schema.gitlabProject.projectId, projectIds)
          ));
        
        if (matchingProjects.length > 0) {
          const projectDbIds = matchingProjects.map(p => p.id);
          conditions.push(inArray(schema.gitlabEvent.projectId, projectDbIds));
        } else {
          // No matching projects found, return empty result
          return [];
        }
      }

      const events = await db
        .select({
          id: schema.gitlabEvent.id,
          gitlabId: schema.gitlabEvent.gitlabId,
          type: schema.gitlabEvent.type,
          action: schema.gitlabEvent.action,
          createdAt: schema.gitlabEvent.createdAt,
          projectId: schema.gitlabEvent.projectId,
        })
        .from(schema.gitlabEvent)
        .where(and(...conditions))
        .orderBy(desc(schema.gitlabEvent.createdAt))
        .limit(100);

      // Get project and vector data separately
      const eventProjectIds = events.map(e => e.projectId);
      const projects = await db
        .select({
          id: schema.gitlabProject.id,
          name: schema.gitlabProject.name,
          namespace: schema.gitlabProject.namespace,
          pathWithNamespace: schema.gitlabProject.pathWithNamespace,
          webUrl: schema.gitlabProject.webUrl,
        })
        .from(schema.gitlabProject)
        .where(inArray(schema.gitlabProject.id, eventProjectIds));

      const eventIds = events.map(e => e.id);
      const vectors = await db
        .select({
          eventId: schema.gitlabEventVector.eventId,
          embeddingText: schema.gitlabEventVector.embeddingText,
        })
        .from(schema.gitlabEventVector)
        .where(inArray(schema.gitlabEventVector.eventId, eventIds))
        .limit(100);

      return events.map((event) => {
        const project = projects.find(p => p.id === event.projectId);
        const vector = vectors.find(v => v.eventId === event.id);
        
        return {
          id: event.id,
          gitlabId: event.gitlabId,
          type: event.type,
          action: event.action,
          createdAt: event.createdAt,
          embeddingText: vector?.embeddingText || null,
          project: project || null,
        };
      });
    },
  });
}
