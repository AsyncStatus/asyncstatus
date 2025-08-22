import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";

export async function generateTeamsEventSummary({
  db,
  eventId,
}: {
  db: Db;
  eventId: string;
}) {
  const event = await db.query.teamsEvent.findFirst({
    where: eq(schema.teamsEvent.id, eventId),
    with: {
      user: true,
      channel: true,
    },
  });

  if (!event) {
    throw new Error(`Teams event ${eventId} not found`);
  }

  // Skip if already has a summary or no content to summarize
  if (event.summary || (!event.body && !event.bodyHtml)) {
    return;
  }

  const content = event.bodyHtml || event.body || "";
  
  // Parse attachments and mentions if present
  let attachmentInfo = "";
  if (event.attachments) {
    try {
      const attachments = JSON.parse(event.attachments);
      if (attachments.length > 0) {
        attachmentInfo = `\nAttachments: ${attachments.map((a: any) => a.name || "unnamed").join(", ")}`;
      }
    } catch {}
  }

  let mentionInfo = "";
  if (event.mentions) {
    try {
      const mentions = JSON.parse(event.mentions);
      if (mentions.length > 0) {
        mentionInfo = `\nMentions: ${mentions.map((m: any) => m.mentionText || "@someone").join(", ")}`;
      }
    } catch {}
  }

  const systemPrompt = `You are a helpful assistant that summarizes Microsoft Teams messages.
Generate a concise summary of the message content, focusing on key information, action items, and decisions.
Keep the summary brief (1-2 sentences) and professional.`;

  const userPrompt = `Summarize this Microsoft Teams message:
Channel: ${event.channel?.displayName || "Unknown"}
From: ${event.user?.displayName || "Unknown User"}
Type: ${event.eventSubtype || event.eventType}
${event.subject ? `Subject: ${event.subject}` : ""}
${event.importance !== "normal" ? `Importance: ${event.importance}` : ""}
Content: ${content}${attachmentInfo}${mentionInfo}`;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      schema: z.object({
        summary: z.string().describe("A concise summary of the Teams message"),
      }),
    });

    await db
      .update(schema.teamsEvent)
      .set({
        summary: object.summary,
        updatedAt: new Date(),
      })
      .where(eq(schema.teamsEvent.id, eventId));
  } catch (error) {
    console.error(`Failed to generate summary for Teams event ${eventId}:`, error);
  }
}