// using github's list events endpoint we get e.g. "PushEvent"
// we want to standardize this to "push"
// but in webhook payloads, the event name is "push"
// so we need to standardize the name to "push"

import type { GithubWebhookEventName } from "./github-event-definition";

// (just using webhook event name convention)
export function standardizeGithubEventName(name: string) {
  return pascalToSnake(name).replace("_event", "") as GithubWebhookEventName;
}

function pascalToSnake(name: string) {
  return name
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .slice(1);
}
