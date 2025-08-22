import { generateText } from "ai";
import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import type { VoyageAIClient } from "voyageai";
import type { Db } from "../../../db/db";
import { eq } from "drizzle-orm";
import * as schema from "../../../db";
import { generateId } from "better-auth";

export async function generateFigmaEventSummary({
  eventId,
  db,
  openRouterProvider,
  voyageClient,
}: {
  eventId: string;
  db: Db;
  openRouterProvider: OpenRouterProvider;
  voyageClient: VoyageAIClient;
}) {
  const event = await db.query.figmaEvent.findFirst({
    where: eq(schema.figmaEvent.id, eventId),
    with: {
      file: true,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Check if summary already exists
  const existingVector = await db.query.figmaEventVector.findFirst({
    where: eq(schema.figmaEventVector.eventId, eventId),
  });

  if (existingVector) {
    return { summary: existingVector.embeddingText, eventId };
  }

  // Prepare context for AI
  const eventContext = {
    type: event.type,
    fileName: event.file?.name || "Unknown File",
    fileType: event.file?.fileType || "design",
    timestamp: event.timestamp,
    payload: event.payload,
  };

  // Generate summary using AI
  const { text } = await generateText({
    model: openRouterProvider("openai/gpt-3.5-turbo"),
    system: `You are an expert design summarizer for Figma events.
Given a Figma event data payload, write a concise summary of the design changes made.
The event might be a FILE_UPDATE, FILE_VERSION_UPDATE, COMMENT, or other Figma event type.

The summary should be no more than 300 words. The summary should use natural language and be easy to understand.
Focus on:
1. What design elements or components were changed or updated
2. The purpose and impact of the design changes
3. Any notable design decisions or iterations
4. Comments or feedback if it's a comment event

The summary must be self-contained and correctly describe the changes made.
You MUST be helpful and concise. You MUST NOT hallucinate.`,
    messages: [
      {
        role: "user",
        content: `Event Type: ${eventContext.type}
File: ${eventContext.fileName} (${eventContext.fileType})
Timestamp: ${eventContext.timestamp}

Event Details:
${JSON.stringify(eventContext.payload, null, 2).slice(0, 2000)}`,
      },
    ],
  });

  // Generate embeddings
  const embeddingResult = await voyageClient.embed({
    input: text,
    model: "voyage-3",
    inputType: "document",
  });

  if (!embeddingResult.data?.[0]?.embedding) {
    throw new Error("Failed to generate embeddings");
  }

  // Store the summary and embeddings
  await db.insert(schema.figmaEventVector).values({
    id: generateId(),
    eventId,
    embeddingText: text,
    embedding: embeddingResult.data[0].embedding,
    createdAt: new Date(),
  });

  return { summary: text, eventId };
}