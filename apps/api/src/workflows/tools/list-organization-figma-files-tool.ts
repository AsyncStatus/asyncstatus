import { z } from "zod/v4";
import { eq, desc } from "drizzle-orm";
import type { Db } from "../../db/db";
import * as schema from "../../db";

const InputSchema = z.object({
  organizationId: z.string().describe("The organization ID"),
  fileType: z.enum(["design", "figjam", "dev_mode"]).optional().describe("Filter by file type"),
  limit: z.number().min(1).max(100).default(20).describe("Maximum number of files to return"),
});

const OutputSchema = z.object({
  files: z.array(
    z.object({
      id: z.string(),
      fileKey: z.string(),
      name: z.string(),
      fileType: z.enum(["design", "figjam", "dev_mode"]),
      thumbnailUrl: z.string().nullable(),
      lastModified: z.date().nullable(),
      projectName: z.string(),
      teamName: z.string(),
    })
  ),
});

export const listOrganizationFigmaFilesTool = ({ db }: { db: Db }) => ({
  name: "list_organization_figma_files",
  description: "List all Figma files for an organization",
  parameters: InputSchema,
  execute: async (input: z.infer<typeof InputSchema>) => {
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, input.organizationId),
      with: {
        teams: {
          with: {
            projects: {
              with: {
                files: {
                  orderBy: [desc(schema.figmaFile.lastModified)],
                  limit: input.limit,
                },
              },
            },
          },
        },
      },
    });

    if (!integration) {
      return { files: [] };
    }

    const files = integration.teams.flatMap((team) =>
      team.projects.flatMap((project) =>
        project.files
          .filter((file) => !input.fileType || file.fileType === input.fileType)
          .map((file) => ({
            id: file.id,
            fileKey: file.fileKey,
            name: file.name,
            fileType: file.fileType as "design" | "figjam" | "dev_mode",
            thumbnailUrl: file.thumbnailUrl,
            lastModified: file.lastModified,
            projectName: project.name,
            teamName: team.name,
          }))
      )
    );

    return { files: files.slice(0, input.limit) };
  },
});