import type { Bindings } from "../lib/env";
import {
  type GithubProcessEventsQueueMessage,
  githubProcessEventsQueue,
} from "./github-process-events-queue";
import {
  type GithubWebhookEventsQueueMessage,
  githubWebhookEventsQueue,
} from "./github-webhook-events-queue";
import {
  type SlackProcessEventsQueueMessage,
  slackProcessEventsQueue,
} from "./slack-process-events-queue";
import {
  type SlackWebhookEventsQueueMessage,
  slackWebhookEventsQueue,
} from "./slack-webhook-events-queue";

type Message =
  | GithubWebhookEventsQueueMessage
  | GithubProcessEventsQueueMessage
  | SlackWebhookEventsQueueMessage
  | SlackProcessEventsQueueMessage;

export async function queue(batch: MessageBatch<Message>, env: Bindings, ctx: ExecutionContext) {
  if (batch.queue === "github-webhook-events") {
    return githubWebhookEventsQueue(
      batch as MessageBatch<GithubWebhookEventsQueueMessage>,
      env,
      ctx,
    );
  }

  if (batch.queue === "github-process-events") {
    return githubProcessEventsQueue(
      batch as MessageBatch<GithubProcessEventsQueueMessage>,
      env,
      ctx,
    );
  }

  if (batch.queue === "slack-webhook-events") {
    return slackWebhookEventsQueue(batch as MessageBatch<SlackWebhookEventsQueueMessage>, env, ctx);
  }

  if (batch.queue === "slack-process-events") {
    return slackProcessEventsQueue(batch as MessageBatch<SlackProcessEventsQueueMessage>, env, ctx);
  }

  throw new Error(`Unknown queue: ${batch.queue}`);
}
