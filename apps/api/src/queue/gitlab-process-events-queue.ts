import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { Bindings } from "../lib/env";
import { generateGitlabEventSummary } from "../workflows/gitlab/steps/generate-gitlab-event-summary";

export type GitlabProcessEventsQueueMessage = schema.GitlabEvent["gitlabId"];

export async function gitlabProcessEventsQueue(
  batch: MessageBatch<GitlabProcessEventsQueueMessage>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const openRouterProvider = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
  const voyageClient = new VoyageAIClient({
    apiKey: env.VOYAGE_API_KEY,
  });

  for (const message of batch.messages) {
    console.log(`Processing GitLab event ${message.body}`);

    const event = await db.query.gitlabEvent.findFirst({
      where: eq(schema.gitlabEvent.gitlabId, message.body),
    });
    
    if (!event) {
      console.log(`GitLab event ${message.body} not found.`);
      message.ack();
      continue;
    }

    const { summary, embedding } = await generateGitlabEventSummary({
      openRouterProvider,
      voyageClient,
      event,
    });
    
    if (!summary || !embedding) {
      console.log(`Failed to generate summary for GitLab event ${message.body}`);
      message.retry({ delaySeconds: 60 });
      continue;
    }

    await db.insert(schema.gitlabEventVector).values({
      id: nanoid(),
      eventId: event.id,
      embeddingText: summary,
      embedding: sql`vector32(${JSON.stringify(embedding)})`,
      createdAt: new Date(),
    });

    message.ack();
  }
}
