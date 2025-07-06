import type { EmitterWebhookEvent, WebhookEvents } from "@octokit/webhooks/types";

export type GithubWebhookEventName = WebhookEvents;

export type AnyGithubWebhookEventDefinition = EmitterWebhookEvent<GithubWebhookEventName>;
