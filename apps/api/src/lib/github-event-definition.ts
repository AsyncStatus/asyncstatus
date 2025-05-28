import type { webhooks as OpenAPIWebhooks } from "@octokit/openapi-webhooks-types";

export type GithubWebhookEventDefinition<
  TEventName extends keyof OpenAPIWebhooks,
> =
  OpenAPIWebhooks[TEventName]["post"]["requestBody"]["content"]["application/json"];

export type AnyGithubWebhookEventDefinition = GithubWebhookEventDefinition<
  keyof OpenAPIWebhooks
>;
