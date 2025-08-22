import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import type { Db } from "../../../db/db";
import * as schema from "../../../db";
import { dayjs } from "@asyncstatus/dayjs";

interface FigmaFileResponse {
  key: string;
  name: string;
  thumbnail_url?: string;
  last_modified?: string;
  editor_type?: string;
}

export async function fetchAndSyncFiles({
  accessToken,
  db,
  integrationId,
  minFileModifiedAt,
}: {
  accessToken: string;
  db: Db;
  integrationId: string;
  minFileModifiedAt?: Date;
}) {
  const integration = await db.query.figmaIntegration.findFirst({
    where: eq(schema.figmaIntegration.id, integrationId),
    with: {
      teams: {
        with: {
          projects: true,
        },
      },
    },
  });

  if (!integration || !integration.teams.length) {
    throw new Error("Integration or teams not found");
  }

  const allFiles: schema.FigmaFileInsert[] = [];
  const fileKeys = new Set<string>();

  for (const team of integration.teams) {
    for (const project of team.projects) {
      // Fetch files for each project
      const response = await fetch(`https://api.figma.com/v1/projects/${project.projectId}/files`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch files for project ${project.projectId}: ${response.statusText}`);
        continue;
      }

      const data = await response.json() as {
        files?: FigmaFileResponse[];
      };
      const files: FigmaFileResponse[] = data.files || [];

      for (const file of files) {
        // Skip if file hasn't been modified recently (if filter is provided)
        if (minFileModifiedAt && file.last_modified) {
          const lastModified = dayjs(file.last_modified);
          if (lastModified.isBefore(minFileModifiedAt)) {
            continue;
          }
        }

        // Determine file type based on editor type or fallback to design
        let fileType: "design" | "figjam" | "dev_mode" = "design";
        if (file.editor_type === "figjam") {
          fileType = "figjam";
        } else if (file.name.toLowerCase().includes("dev")) {
          fileType = "dev_mode";
        }

        allFiles.push({
          id: generateId(),
          projectId: project.id,
          fileKey: file.key,
          name: file.name,
          description: null,
          fileType,
          thumbnailUrl: file.thumbnail_url || null,
          lastModified: file.last_modified ? new Date(file.last_modified) : null,
          editorType: file.editor_type || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        fileKeys.add(file.key);
      }
    }
  }

  if (allFiles.length > 0) {
    // Batch insert files with conflict resolution
    for (const file of allFiles) {
      await db
        .insert(schema.figmaFile)
        .values(file)
        .onConflictDoUpdate({
          target: schema.figmaFile.fileKey,
          set: {
            name: file.name,
            fileType: file.fileType,
            thumbnailUrl: file.thumbnailUrl,
            lastModified: file.lastModified,
            editorType: file.editorType,
            updatedAt: new Date(),
          },
        });
    }
  }

  return { fileCount: allFiles.length, fileKeys };
}