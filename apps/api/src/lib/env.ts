import Anthropic from "@anthropic-ai/sdk";
import { Webhooks as GithubWebhooks } from "@octokit/webhooks";
import { createOpenRouter, type OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import type { SlackEvent } from "@slack/web-api";
import type { InferSelectModel } from "drizzle-orm";
import type { Context, Next } from "hono";
import { Resend } from "resend";
import { VoyageAIClient } from "voyageai";
import type * as schema from "../db";
import type { Db } from "../db/db";
import { createDb } from "../db/db";
import type { DiscordGatewayDurableObject } from "../durable-objects/discord-gateway";
import type { DeleteGithubIntegrationWorkflowParams } from "../workflows/github/delete-github-integration";
import type { SyncGithubWorkflowParams } from "../workflows/github/sync-github";
import type { GenerateStatusUpdatesWorkflowParams } from "../workflows/schedules/generate-status-updates";
import type { PingForUpdatesWorkflowParams } from "../workflows/schedules/ping-for-updates";
import type { SendSummariesWorkflowParams } from "../workflows/schedules/send-summaries";
import type { DeleteSlackIntegrationWorkflowParams } from "../workflows/slack/delete-slack-integration";
import type { SyncSlackWorkflowParams } from "../workflows/slack/sync-slack";
import type { Auth, Session } from "./auth";
import { createAuth } from "./auth";
import type { AnyGithubWebhookEventDefinition } from "./github-event-definition";
import type { RateLimiter } from "./rate-limiter";
import { createRateLimiter } from "./rate-limiter";
import { createStripe } from "./stripe";

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
  AI: Ai;
  GITHUB_WEBHOOK_SECRET: string;
  GITHUB_WEBHOOK_EVENTS_QUEUE: Queue<AnyGithubWebhookEventDefinition>;
  GITHUB_PROCESS_EVENTS_QUEUE: Queue<string>;
  OPENROUTER_API_KEY: string;
  SLACK_APP_ID: string;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  SLACK_SIGNING_SECRET: string;
  SLACK_STATE_SECRET: string;
  SLACK_WEBHOOK_EVENTS_QUEUE: Queue<SlackEvent>;
  SLACK_PROCESS_EVENTS_QUEUE: Queue<string>;
  SYNC_SLACK_WORKFLOW: Workflow<SyncSlackWorkflowParams>;
  DELETE_SLACK_INTEGRATION_WORKFLOW: Workflow<DeleteSlackIntegrationWorkflowParams>;
  DISCORD_APP_ID: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_WEBHOOK_EVENTS_QUEUE: Queue<any>; // TODO: Add proper Discord event type
  DISCORD_PROCESS_EVENTS_QUEUE: Queue<string>;
  SYNC_DISCORD_WORKFLOW: Workflow<any>; // TODO: Add SyncDiscordWorkflowParams
  DELETE_DISCORD_INTEGRATION_WORKFLOW: Workflow<any>; // TODO: Add DeleteDiscordIntegrationWorkflowParams
  FETCH_DISCORD_MESSAGES_WORKFLOW: Workflow<any>; // TODO: Add FetchDiscordMessagesWorkflowParams
  PING_FOR_UPDATES_WORKFLOW: Workflow<PingForUpdatesWorkflowParams>;
  GENERATE_STATUS_UPDATES_WORKFLOW: Workflow<GenerateStatusUpdatesWorkflowParams>;
  SEND_SUMMARIES_WORKFLOW: Workflow<SendSummariesWorkflowParams>;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  DISCORD_GATEWAY_DO: DurableObjectNamespace<DiscordGatewayDurableObject>;
  STRIPE_KV: KVNamespace;
  STRIPE_BASIC_PRICE_ID: string;
  STRIPE_STARTUP_PRICE_ID: string;
  STRIPE_ENTERPRISE_PRICE_ID: string;
  STRIPE_ADD_25_GENERATIONS_PRICE_ID: string;
  STRIPE_ADD_100_GENERATIONS_PRICE_ID: string;
  AI_BASIC_MONTHLY_LIMIT: string;
  AI_STARTUP_MONTHLY_LIMIT: string;
  AI_ENTERPRISE_MONTHLY_LIMIT: string;
};

export type Variables = {
  auth: Auth;
  db: Db;
  resend: Resend;
  betterAuthUrl: string;
  session: Auth["$Infer"]["Session"] | null;
  rateLimiter: { waitlist: RateLimiter };
  anthropicClient: Anthropic;
  voyageClient: VoyageAIClient;
  githubWebhooks: GithubWebhooks;
  authKv: KVNamespace;
  openRouterProvider: OpenRouterProvider;
  workflow: {
    syncGithub: Workflow<SyncGithubWorkflowParams>;
    deleteGithubIntegration: Workflow<DeleteGithubIntegrationWorkflowParams>;
    syncSlack: Workflow<SyncSlackWorkflowParams>;
    deleteSlackIntegration: Workflow<DeleteSlackIntegrationWorkflowParams>;
    syncDiscord: Workflow<any>; // TODO: Add SyncDiscordWorkflowParams
    deleteDiscordIntegration: Workflow<any>; // TODO: Add DeleteDiscordIntegrationWorkflowParams
    fetchDiscordMessages: Workflow<any>; // TODO: Add FetchDiscordMessagesWorkflowParams
    pingForUpdates: Workflow<PingForUpdatesWorkflowParams>;
    generateStatusUpdates: Workflow<GenerateStatusUpdatesWorkflowParams>;
    sendSummaries: Workflow<SendSummariesWorkflowParams>;
  };
  slack: {
    appId: string;
    clientId: string;
    clientSecret: string;
    signingSecret: string;
    stateSecret: string;
  };
  discord: {
    appId: string;
    clientId: string;
    clientSecret: string;
    botToken: string;
    publicKey: string;
    gatewayDo: DurableObjectNamespace<DiscordGatewayDurableObject>;
  };
  stripeClient: ReturnType<typeof createStripe>;
  stripeConfig: {
    secretKey: string;
    webhookSecret: string;
    kv: KVNamespace;
    priceIds: {
      basic: string;
      startup: string;
      enterprise: string;
      add25Generations: string;
      add100Generations: string;
    };
    aiLimits: {
      basic: number;
      startup: number;
      enterprise: number;
    };
  };
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
  const waitlistRateLimiter = createRateLimiter(c.env.RATE_LIMITER, {
    windowMs: 60 * 60 * 1000,
    limit: 10,
  });
  const invitationRateLimiter = createRateLimiter(c.env.RATE_LIMITER, {
    windowMs: 60 * 60 * 1000,
    limit: 100,
  });
  const anthropicClient = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
  const voyageClient = new VoyageAIClient({
    apiKey: c.env.VOYAGE_API_KEY,
  });
  const githubWebhooks = new GithubWebhooks({
    secret: c.env.GITHUB_WEBHOOK_SECRET,
  });
  const betterAuthUrl = c.env.BETTER_AUTH_URL;
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const openRouterProvider = createOpenRouter({ apiKey: c.env.OPENROUTER_API_KEY });

  return {
    db,
    resend,
    auth,
    anthropicClient,
    voyageClient,
    githubWebhooks,
    session,
    betterAuthUrl,
    webAppUrl: c.env.WEB_APP_URL,
    authKv: c.env.AS_PROD_AUTH_KV,
    slack: {
      appId: c.env.SLACK_APP_ID,
      clientId: c.env.SLACK_CLIENT_ID,
      clientSecret: c.env.SLACK_CLIENT_SECRET,
      signingSecret: c.env.SLACK_SIGNING_SECRET,
      stateSecret: c.env.SLACK_STATE_SECRET,
    },
    discord: {
      appId: c.env.DISCORD_APP_ID,
      clientId: c.env.DISCORD_CLIENT_ID,
      clientSecret: c.env.DISCORD_CLIENT_SECRET,
      botToken: c.env.DISCORD_BOT_TOKEN,
      publicKey: c.env.DISCORD_PUBLIC_KEY,
      webhookEventsQueue: c.env.DISCORD_WEBHOOK_EVENTS_QUEUE,
      processEventsQueue: c.env.DISCORD_PROCESS_EVENTS_QUEUE,
      gatewayDo: c.env.DISCORD_GATEWAY_DO,
    },
    stripeClient: createStripe(c.env.STRIPE_SECRET_KEY),
    stripeConfig: {
      secretKey: c.env.STRIPE_SECRET_KEY,
      webhookSecret: c.env.STRIPE_WEBHOOK_SECRET,
      kv: c.env.STRIPE_KV,
      priceIds: {
        basic: c.env.STRIPE_BASIC_PRICE_ID,
        startup: c.env.STRIPE_STARTUP_PRICE_ID,
        enterprise: c.env.STRIPE_ENTERPRISE_PRICE_ID,
        add25Generations: c.env.STRIPE_ADD_25_GENERATIONS_PRICE_ID,
        add100Generations: c.env.STRIPE_ADD_100_GENERATIONS_PRICE_ID,
      },
      aiLimits: {
        basic: parseInt(c.env.AI_BASIC_MONTHLY_LIMIT),
        startup: parseInt(c.env.AI_STARTUP_MONTHLY_LIMIT),
        enterprise: parseInt(c.env.AI_ENTERPRISE_MONTHLY_LIMIT),
      },
    },
    openRouterProvider,
    rateLimiter: {
      waitlist: (next: Next) => waitlistRateLimiter(c, next),
      invitation: (next: Next) => invitationRateLimiter(c, next),
    },
    workflow: {
      syncGithub: c.env.SYNC_GITHUB_WORKFLOW,
      deleteGithubIntegration: c.env.DELETE_GITHUB_INTEGRATION_WORKFLOW,
      syncSlack: c.env.SYNC_SLACK_WORKFLOW,
      deleteSlackIntegration: c.env.DELETE_SLACK_INTEGRATION_WORKFLOW,
      syncDiscord: c.env.SYNC_DISCORD_WORKFLOW,
      deleteDiscordIntegration: c.env.DELETE_DISCORD_INTEGRATION_WORKFLOW,
      fetchDiscordMessages: c.env.FETCH_DISCORD_MESSAGES_WORKFLOW,
      pingForUpdates: c.env.PING_FOR_UPDATES_WORKFLOW,
      generateStatusUpdates: c.env.GENERATE_STATUS_UPDATES_WORKFLOW,
      sendSummaries: c.env.SEND_SUMMARIES_WORKFLOW,
    },
    bucket: {
      private: c.env.PRIVATE_BUCKET,
    },
  };
}

export type ASContext = Awaited<ReturnType<typeof createContext>>;

export type TypedHandlersContext = ASContext;
export type TypedHandlersContextWithSession = ASContext & {
  session: Session;
};
export type TypedHandlersContextWithOrganization = TypedHandlersContextWithSession & {
  organization: InferSelectModel<typeof schema.organization>;
  member: InferSelectModel<typeof schema.member>;
};
