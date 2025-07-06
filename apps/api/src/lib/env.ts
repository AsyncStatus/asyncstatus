import Anthropic from "@anthropic-ai/sdk";
import { Webhooks as GithubWebhooks } from "@octokit/webhooks";
import type { InferSelectModel } from "drizzle-orm";
import type { Context } from "hono";
import { Resend } from "resend";
import { VoyageAIClient } from "voyageai";
import type * as schema from "../db";
import type { Db } from "../db/db";
import { createDb } from "../db/db";
import type { GenerateStatusWorkflowParams } from "../workflows/generate-status";
import type { DeleteGithubIntegrationWorkflowParams } from "../workflows/github/delete-github-integration";
import type { SyncGithubWorkflowParams } from "../workflows/github/sync-github-v2";
import type { Auth } from "./auth";
import { createAuth } from "./auth";
import type { AnyGithubWebhookEventDefinition } from "./github-event-definition";
import type { RateLimiter } from "./rate-limiter";
import { createRateLimiter } from "./rate-limiter";

export type Bindings = {
  NODE_ENV: string;
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
  githubWebhooks: GithubWebhooks;
  authKv: KVNamespace;
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

export async function createContext(c: Context<HonoEnv>) {
  const db = createDb(c.env);
  const resend = new Resend(c.env.RESEND_API_KEY);
  const auth = createAuth(c.env, db, resend);
  const waitlistRateLimiter = createRateLimiter(c.env, {
    windowMs: 60 * 60 * 1000,
    limit: 10,
  });
  const anthropicClient = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
  const voyageClient = new VoyageAIClient({
    apiKey: c.env.VOYAGE_API_KEY,
  });
  const githubWebhooks = new GithubWebhooks({
    secret: c.env.GITHUB_WEBHOOK_SECRET,
  });
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  return {
    db,
    resend,
    auth,
    waitlistRateLimiter,
    anthropicClient,
    voyageClient,
    githubWebhooks,
    session,
    authKv: c.env.AS_PROD_AUTH_KV,
    bucket: {
      private: c.env.PRIVATE_BUCKET,
    },
  };
}

export type ASContext = Awaited<ReturnType<typeof createContext>>;

export type TypedHandlersContext = ASContext;
export type TypedHandlersContextWithSession = ASContext & {
  session: Auth["$Infer"]["Session"];
};
export type TypedHandlersContextWithOrganization = TypedHandlersContextWithSession & {
  organization: InferSelectModel<typeof schema.organization>;
  member: InferSelectModel<typeof schema.member>;
};
