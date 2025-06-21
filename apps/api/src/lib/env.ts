import type Anthropic from "@anthropic-ai/sdk";
import type { Webhooks } from "@octokit/webhooks";
import type { InferSelectModel } from "drizzle-orm";
import type { Resend } from "resend";
import type { VoyageAIClient } from "voyageai";

import type { Db } from "../db";
import * as schema from "../db/schema";
import type { GenerateStatusWorkflowParams } from "../workflows/generate-status";
import type { DeleteGithubIntegrationWorkflowParams } from "../workflows/github/delete-github-integration";
import type { SyncGithubWorkflowParams } from "../workflows/github/sync-github-v2";
import type { Auth } from "./auth";
import type { AnyGithubWebhookEventDefinition } from "./github-event-definition";
import type { RateLimiter } from "./rate-limiter";

export type Bindings = {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  TURSO_ENCRYPTION_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  AS_PROD_AUTH_KV: KVNamespace;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  RESEND_API_KEY: string;
  WEB_APP_URL: string;
  PRIVATE_BUCKET: R2Bucket;
  ANTHROPIC_API_KEY: string;
  VOYAGE_API_KEY: string;
  RATE_LIMITER: KVNamespace;
  SYNC_GITHUB_WORKFLOW: Workflow<SyncGithubWorkflowParams>;
  DELETE_GITHUB_INTEGRATION_WORKFLOW: Workflow<DeleteGithubIntegrationWorkflowParams>;
  GENERATE_STATUS_WORKFLOW: Workflow<GenerateStatusWorkflowParams>;
  AI: Ai;
  GITHUB_WEBHOOK_SECRET: string;
  GITHUB_WEBHOOK_EVENTS_QUEUE: Queue<AnyGithubWebhookEventDefinition>;
  GITHUB_PROCESS_EVENTS_QUEUE: Queue<string>;
};

export type Variables = {
  auth: Auth;
  db: Db;
  resend: Resend;
  session: Auth["$Infer"]["Session"] | null;
  waitlistRateLimiter: RateLimiter;
  anthropicClient: Anthropic;
  voyageClient: VoyageAIClient;
  githubWebhooks: Webhooks;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

export type HonoEnvWithSession = HonoEnv & {
  Variables: Variables & { session: Auth["$Infer"]["Session"] };
};

export type HonoEnvWithOrganization = HonoEnvWithSession & {
  Variables: Variables & {
    organization: InferSelectModel<typeof schema.organization>;
    member: InferSelectModel<typeof schema.member>;
  };
};
