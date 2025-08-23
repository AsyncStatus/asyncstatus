import type { Bindings } from "../lib/env";
import {
  type DiscordProcessEventsQueueMessage,
  discordProcessEventsQueue,
} from "./discord-process-events-queue";
import {
  type DiscordWebhookEventsQueueMessage,
  discordWebhookEventsQueue,
} from "./discord-webhook-events-queue";
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
import {
  type GitlabProcessEventsQueueMessage,
  gitlabProcessEventsQueue,
} from "./gitlab-process-events-queue";
import {
  type GitlabWebhookEventsQueueMessage,
  gitlabWebhookEventsQueue,
} from "./gitlab-webhook-events-queue";

type QueueMessage =
  | GithubWebhookEventsQueueMessage
  | GithubProcessEventsQueueMessage
  | GitlabWebhookEventsQueueMessage
  | GitlabProcessEventsQueueMessage
  | SlackWebhookEventsQueueMessage
  | SlackProcessEventsQueueMessage
  | DiscordWebhookEventsQueueMessage
  | DiscordProcessEventsQueueMessage;

export async function queue(
  batch: MessageBatch<QueueMessage>,
  env: Bindings,
  ctx: ExecutionContext,
) {
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

  if (batch.queue === "discord-webhook-events") {
    return discordWebhookEventsQueue(
      batch as MessageBatch<DiscordWebhookEventsQueueMessage>,
      env,
      ctx,
    );
  }

  if (batch.queue === "discord-process-events") {
    return discordProcessEventsQueue(
      batch as MessageBatch<DiscordProcessEventsQueueMessage>,
      env,
      ctx,
    );
  }

  if (batch.queue === "gitlab-webhook-events") {
    return gitlabWebhookEventsQueue(
      batch as MessageBatch<GitlabWebhookEventsQueueMessage>,
      env,
      ctx,
    );
  }

  if (batch.queue === "gitlab-process-events") {
    return gitlabProcessEventsQueue(
      batch as MessageBatch<GitlabProcessEventsQueueMessage>,
      env,
      ctx,
    );
  }

  throw new Error(`Unknown queue: ${batch.queue}`);
}
