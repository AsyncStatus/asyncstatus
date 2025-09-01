import Anthropic from "@anthropic-ai/sdk";
import type { Db } from "@asyncstatus/db/create-db";
import { createDb } from "@asyncstatus/db/create-db";
import { createOpenRouter, type OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import type { Context } from "hono";
import { Resend } from "resend";
import { VoyageAIClient } from "voyageai";
import type { ChangelogGenerationJobWorkflowParams } from "../workflows/github/changelog-generation-job";

export type Bindings = {
  NODE_ENV: string;
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  TURSO_ENCRYPTION_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_APP_NAME: string;
  GITLAB_CLIENT_ID: string;
  GITLAB_CLIENT_SECRET: string;
  GITLAB_INSTANCE_URL?: string;
  GITLAB_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  CHANGELOG_APP_URL: string;
  ANTHROPIC_API_KEY: string;
  VOYAGE_API_KEY: string;
  AI: Ai;
  GITHUB_WEBHOOK_SECRET: string;
  OPENROUTER_API_KEY: string;
  SLACK_APP_ID: string;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  SLACK_SIGNING_SECRET: string;
  SLACK_STATE_SECRET: string;
  LINEAR_CLIENT_ID: string;
  LINEAR_CLIENT_SECRET: string;
  LINEAR_WEBHOOK_SECRET: string;
  DISCORD_APP_ID: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  CHANGELOG_GENERATION_JOB_WORKFLOW: Workflow<ChangelogGenerationJobWorkflowParams>;
};

export type Variables = {
  db: Db;
  resend: Resend;
  betterAuthUrl: string;
  anthropicClient: Anthropic;
  voyageClient: VoyageAIClient;
  openRouterProvider: OpenRouterProvider;
  workflow: {
    changelogGenerationJob: Workflow<ChangelogGenerationJobWorkflowParams>;
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
  };
  github: {
    appId: string;
    clientId: string;
    clientSecret: string;
    privateKey: string;
    appName: string;
  };
  gitlab: {
    clientId: string;
    clientSecret: string;
    instanceUrl: string;
  };
  linear: {
    clientId: string;
    clientSecret: string;
    webhookSecret: string;
  };
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

export async function createContext(c: Context<HonoEnv>) {
  const db = createDb(c.env);
  const resend = new Resend(c.env.RESEND_API_KEY);
  const anthropicClient = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
  const voyageClient = new VoyageAIClient({
    apiKey: c.env.VOYAGE_API_KEY,
  });
  const betterAuthUrl = c.env.BETTER_AUTH_URL;
  const openRouterProvider = createOpenRouter({ apiKey: c.env.OPENROUTER_API_KEY });

  return {
    db,
    resend,
    anthropicClient,
    voyageClient,
    betterAuthUrl,
    changelogAppUrl: c.env.CHANGELOG_APP_URL,
    github: {
      appId: c.env.GITHUB_APP_ID,
      clientId: c.env.GITHUB_CLIENT_ID,
      clientSecret: c.env.GITHUB_CLIENT_SECRET,
      privateKey: c.env.GITHUB_APP_PRIVATE_KEY,
      appName: c.env.GITHUB_APP_NAME,
    },
    gitlab: {
      clientId: c.env.GITLAB_CLIENT_ID,
      clientSecret: c.env.GITLAB_CLIENT_SECRET,
      instanceUrl: c.env.GITLAB_INSTANCE_URL || "https://gitlab.com",
      webhookSecret: c.env.GITLAB_WEBHOOK_SECRET,
    },
    linear: {
      clientId: c.env.LINEAR_CLIENT_ID,
      clientSecret: c.env.LINEAR_CLIENT_SECRET,
      webhookSecret: c.env.LINEAR_WEBHOOK_SECRET,
    },
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
    },
    openRouterProvider,
    workflow: {
      changelogGenerationJob: c.env.CHANGELOG_GENERATION_JOB_WORKFLOW,
    },
  };
}

export type ASContext = Awaited<ReturnType<typeof createContext>>;
export type TypedHandlersContext = ASContext;
