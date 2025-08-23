import {
  TYPED_HANDLERS_ERROR_STATUS_CODES_BY_KEY,
  TypedHandlersError,
} from "@asyncstatus/typed-handlers";
import { typedHandlersHonoServer } from "@asyncstatus/typed-handlers/hono";
import { verifyAsync } from "@noble/ed25519";
import { createWebMiddleware as createGithubWebhooksMiddleware } from "@octokit/webhooks";
import type { SlackEvent } from "@slack/web-api";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  AsyncStatusApiError,
  type AsyncStatusApiJsonError,
  AsyncStatusUnexpectedApiError,
} from "./errors";
import { createContext, type HonoEnv } from "./lib/env";
import { verifySlackRequest } from "./lib/slack";
import { handleStripeWebhook } from "./lib/stripe-webhook";
import { queue } from "./queue/queue";
import { scheduled } from "./scheduled";
import {
  confirmAdditionalGenerationsPaymentHandler,
  purchaseAdditionalGenerationsHandler,
} from "./typed-handlers/ai-usage-handlers";
import {
  addCliStatusUpdateItemHandler,
  editCliStatusUpdateHandler,
  getCliStatusUpdateByDateHandler,
  listRecentStatusUpdatesHandler,
  showCurrentStatusUpdateHandler,
  undoLastCliStatusUpdateItemHandler,
} from "./typed-handlers/cli-handlers";
import {
  getDiscordGatewayStatusHandler,
  startDiscordGatewayHandler,
  stopDiscordGatewayHandler,
} from "./typed-handlers/discord-gateway-handlers";
import {
  deleteDiscordIntegrationHandler,
  discordAddIntegrationCallbackHandler,
  discordIntegrationCallbackHandler,
  fetchDiscordMessagesHandler,
  getDiscordIntegrationHandler,
  listDiscordChannelsHandler,
  listDiscordServersHandler,
  listDiscordUsersHandler,
} from "./typed-handlers/discord-integration-handlers";
import { getFileHandler } from "./typed-handlers/file-handlers";
import {
  deleteGithubIntegrationHandler,
  getGithubIntegrationHandler,
  githubIntegrationCallbackHandler,
  listGithubRepositoriesHandler,
  listGithubUsersHandler,
  resyncGithubIntegrationHandler,
} from "./typed-handlers/github-integration-handlers";
import {
  acceptInvitationHandler,
  cancelInvitationHandler,
  getInvitationHandler,
  listUserInvitationsHandler,
  rejectInvitationHandler,
} from "./typed-handlers/invitation-handlers";
import {
  getMemberHandler,
  inviteMemberHandler,
  listMembersHandler,
  updateMemberHandler,
} from "./typed-handlers/member-handlers";
import {
  createOnboardingRecommendedAutomationsHandler,
  updateUserOnboardingHandler,
} from "./typed-handlers/onboarding-handlers";
import {
  createOrganizationHandler,
  getOrganizationHandler,
  getOrganizationUserHandler,
  listMemberOrganizationsHandler,
  setActiveOrganizationHandler,
  updateOrganizationHandler,
} from "./typed-handlers/organization-handlers";
import { getPublicStatusUpdateHandler } from "./typed-handlers/public-status-update-handlers";
import {
  createScheduleHandler,
  deleteScheduleHandler,
  generateScheduleHandler,
  getScheduleHandler,
  listSchedulesHandler,
  runScheduleHandler,
  updateScheduleHandler,
} from "./typed-handlers/schedule-handlers";
import {
  deleteGitlabIntegrationHandler,
  getGitlabIntegrationHandler,
  gitlabIntegrationCallbackHandler,
  listGitlabProjectsHandler,
  listGitlabUsersHandler,
  resyncGitlabIntegrationHandler,
} from "./typed-handlers/gitlab-integration-handlers";
import {
  deleteSlackIntegrationHandler,
  getSlackIntegrationHandler,
  listSlackChannelsHandler,
  listSlackUsersHandler,
  slackAddIntegrationCallbackHandler,
  slackIntegrationCallbackHandler,
} from "./typed-handlers/slack-integration-handlers";
import {
  createStatusUpdateHandler,
  deleteStatusUpdateHandler,
  generateStatusUpdateHandler,
  getMemberStatusUpdateHandler,
  getStatusUpdateHandler,
  listStatusUpdatesByDateHandler,
  listStatusUpdatesByMemberHandler,
  listStatusUpdatesByTeamHandler,
  listStatusUpdatesHandler,
  shareStatusUpdateHandler,
  updateStatusUpdateHandler,
} from "./typed-handlers/status-update-handlers";
import {
  cancelStripeSubscriptionHandler,
  createPortalSessionHandler,
  generateStripeCheckoutHandler,
  getSubscriptionHandler,
  reactivateStripeSubscriptionHandler,
  stripeSuccessHandler,
  syncSubscriptionHandler,
} from "./typed-handlers/stripe-handlers";
import {
  addTeamMemberHandler,
  createTeamHandler,
  deleteTeamHandler,
  deleteTeamMemberHandler,
  getTeamHandler,
  getTeamMembersHandler,
  listTeamsHandler,
  updateTeamHandler,
} from "./typed-handlers/team-handlers";
import { joinWaitlistHandler } from "./typed-handlers/waitlist-handlers";

const authRouter = new Hono<HonoEnv>()
  .get("/session", (c) => {
    const session = c.get("session");

    if (!session) {
      throw new TypedHandlersError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    return c.json(session);
  })
  .on(["POST", "GET"], "*", (c) => {
    return c.get("auth").handler(c.req.raw);
  });

const githubWebhooksRouter = new Hono<HonoEnv>().on(["POST"], "*", (c) => {
  const githubWebhooks = c.get("githubWebhooks");

  githubWebhooks.onAny(async (event) => {
    const queue = c.env.GITHUB_WEBHOOK_EVENTS_QUEUE;
    await queue.send(event, { contentType: "json" });
  });

  return createGithubWebhooksMiddleware(githubWebhooks, { path: "/integrations/github/webhooks" })(
    c.req.raw,
  );
});

const gitlabWebhooksRouter = new Hono<HonoEnv>().on(["POST"], "*", async (c) => {
  const rawBody = await c.req.raw.text();
  const gitlabToken = c.req.header("X-Gitlab-Token");
  const gitlabEvent = c.req.header("X-Gitlab-Event");
  
  // Verify webhook token (GitLab uses simple token verification)
  if (!gitlabToken || gitlabToken !== c.env.GITLAB_WEBHOOK_SECRET) {
    return c.json({ error: "Invalid webhook token" }, 401);
  }
  
  if (!gitlabEvent) {
    return c.json({ error: "Missing GitLab event header" }, 400);
  }
  
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }
  
  // Add event type to payload
  const eventPayload = {
    ...body,
    gitlab_event: gitlabEvent,
  };
  
  const queue = c.env.GITLAB_WEBHOOK_EVENTS_QUEUE;
  await queue.send(eventPayload, { contentType: "json" });
  
  return c.json({ ok: true }, 200);
});

const slackWebhooksRouter = new Hono<HonoEnv>().on(["POST"], "*", async (c) => {
  const rawBody = await c.req.raw.text();
  const isValid = await verifySlackRequest(c.env.SLACK_SIGNING_SECRET, c.req.raw.headers, rawBody);
  if (!isValid) {
    return c.json({ error: "Invalid request" }, 400);
  }
  let body: SlackEvent;
  try {
    body = JSON.parse(rawBody) as SlackEvent;
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }
  if ("challenge" in body) {
    return c.json(body, 200);
  }
  const queue = c.env.SLACK_WEBHOOK_EVENTS_QUEUE;
  await queue.send(body, { contentType: "json" });
  return c.json({ ok: true }, 200);
});

const discordWebhooksRouter = new Hono<HonoEnv>().on(["POST"], "*", async (c) => {
  const rawBody = await c.req.raw.text();
  const signature = c.req.header("X-Signature-Ed25519");
  const timestamp = c.req.header("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    return c.json({ error: "Missing signature headers" }, 401);
  }

  try {
    const message = timestamp + rawBody;
    const isValid = await verifyAsync(
      Buffer.from(signature, "hex"),
      Buffer.from(message),
      Buffer.from(c.env.DISCORD_PUBLIC_KEY, "hex"),
    );

    if (!isValid) {
      console.warn("Invalid Discord webhook signature");
      return c.json({ error: "Invalid signature" }, 401);
    }
  } catch (error) {
    console.error("Discord signature verification error:", error);
    return c.json({ error: "Signature verification failed" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  // Handle Discord webhook types
  // Type 0 = PING (verify webhook URL is active)
  if (body.type === 0) {
    return c.body(null, 204); // Return 204 No Content for PING
  }

  // Type 1 = Event (actual webhook event)
  if (body.type === 1 && body.event) {
    const queue = c.env.DISCORD_WEBHOOK_EVENTS_QUEUE;
    await queue.send(body.event, { contentType: "json" });
    return c.body(null, 204); // Return 204 No Content for successful processing
  }

  // Unknown webhook type
  console.error("Unknown Discord webhook type:", body.type);
  return c.json({ error: "Unknown webhook type" }, 400);
});

const stripeWebhooksRouter = new Hono<HonoEnv>().on(["POST"], "*", async (c) => {
  const body = await c.req.raw.text();
  const signature = c.req.header("Stripe-Signature");

  if (!signature) {
    return c.json({ error: "Missing signature" }, 400);
  }

  const result = await handleStripeWebhook({
    stripe: c.get("stripeClient"),
    db: c.get("db"),
    webhookSecret: c.env.STRIPE_WEBHOOK_SECRET,
    kv: c.env.STRIPE_KV,
    body,
    signature,
    executionCtx: c.executionCtx,
  });

  if (!result.success) {
    console.error("[STRIPE WEBHOOK] Error:", result.error);
    return c.json({ error: result.error }, 400);
  }

  return c.json({ received: true });
});

const app = new Hono<HonoEnv>()
  .use(
    "*",
    cors({
      origin: (origin, c) => {
        if (c.env.NODE_ENV === "development") {
          return origin;
        }
        if (origin.endsWith("asyncstatus.com")) {
          return origin;
        }
        return "https://app.asyncstatus.com";
      },
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "Content-Disposition",
        "Content-Length",
        "ETag",
        "Cache-Control",
      ],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      maxAge: 600,
      credentials: true,
    }),
  )
  .use(async (c, next) => {
    const context = await createContext(c);
    c.set("db", context.db);
    c.set("resend", context.resend);
    c.set("auth", context.auth);
    c.set("rateLimiter" as any, context.rateLimiter);
    c.set("anthropicClient", context.anthropicClient);
    c.set("openRouterProvider", context.openRouterProvider);
    c.set("voyageClient", context.voyageClient);
    c.set("githubWebhooks", context.githubWebhooks);
    c.set("session" as any, context.session);
    c.set("workflow", context.workflow);
    c.set("slack", context.slack);
    c.set("discord", context.discord);
    c.set("stripeClient", context.stripeClient);
    c.set("stripeConfig", context.stripeConfig);
    c.set("betterAuthUrl", context.betterAuthUrl);
    c.set("github", context.github);
    c.set("gitlab", context.gitlab);
    return next();
  })
  .route("/auth", authRouter)
  .route("/integrations/github/webhooks", githubWebhooksRouter)
  .route("/integrations/gitlab/webhooks", gitlabWebhooksRouter)
  .route("/integrations/slack/webhooks", slackWebhooksRouter)
  .route("/integrations/discord/webhooks", discordWebhooksRouter)
  .route("/integrations/stripe/webhooks", stripeWebhooksRouter)
  .onError((err, c) => {
    console.error(err);
    if (err instanceof TypedHandlersError) {
      return c.json(
        { type: err.name, message: err.message, code: err.code, cause: err.cause },
        TYPED_HANDLERS_ERROR_STATUS_CODES_BY_KEY[
          err.code ?? "INTERNAL_SERVER_ERROR"
        ] as ContentfulStatusCode,
      );
    }
    if (err instanceof AsyncStatusUnexpectedApiError) {
      return c.json({ type: err.name, message: err.message }, err.status);
    }
    if (err instanceof AsyncStatusApiError) {
      return c.json({ type: err.name, message: err.message }, err.status);
    }
    const error = {
      type: "ASAPIUnexpectedError",
      message: "An unexpected error occurred. Please try again later.",
    } satisfies AsyncStatusApiJsonError;
    return c.json(error, 500);
  });

const typedHandlersApp = typedHandlersHonoServer(
  app,
  [
    joinWaitlistHandler,
    listUserInvitationsHandler,
    getInvitationHandler,
    cancelInvitationHandler,
    acceptInvitationHandler,
    rejectInvitationHandler,
    updateMemberHandler,
    getMemberHandler,
    listMembersHandler,
    inviteMemberHandler,
    getFileHandler,
    listMemberOrganizationsHandler,
    getOrganizationHandler,
    setActiveOrganizationHandler,
    createOrganizationHandler,
    updateOrganizationHandler,
    listTeamsHandler,
    getTeamHandler,
    getTeamMembersHandler,
    createTeamHandler,
    updateTeamHandler,
    deleteTeamHandler,
    addTeamMemberHandler,
    deleteTeamMemberHandler,
    listSchedulesHandler,
    getScheduleHandler,
    createScheduleHandler,
    updateScheduleHandler,
    deleteScheduleHandler,
    generateScheduleHandler,
    listStatusUpdatesHandler,
    listStatusUpdatesByMemberHandler,
    listStatusUpdatesByDateHandler,
    listStatusUpdatesByTeamHandler,
    getStatusUpdateHandler,
    getMemberStatusUpdateHandler,
    updateStatusUpdateHandler,
    createStatusUpdateHandler,
    deleteStatusUpdateHandler,
    generateStatusUpdateHandler,
    addCliStatusUpdateItemHandler,
    editCliStatusUpdateHandler,
    getCliStatusUpdateByDateHandler,
    undoLastCliStatusUpdateItemHandler,
    showCurrentStatusUpdateHandler,
    listRecentStatusUpdatesHandler,
    getGithubIntegrationHandler,
    githubIntegrationCallbackHandler,
    listGithubRepositoriesHandler,
    listGithubUsersHandler,
    deleteGithubIntegrationHandler,
    resyncGithubIntegrationHandler,
    gitlabIntegrationCallbackHandler,
    getGitlabIntegrationHandler,
    listGitlabProjectsHandler,
    listGitlabUsersHandler,
    deleteGitlabIntegrationHandler,
    resyncGitlabIntegrationHandler,
    slackIntegrationCallbackHandler,
    getSlackIntegrationHandler,
    listSlackChannelsHandler,
    listSlackUsersHandler,
    deleteSlackIntegrationHandler,
    discordIntegrationCallbackHandler,
    getDiscordIntegrationHandler,
    listDiscordServersHandler,
    listDiscordChannelsHandler,
    listDiscordUsersHandler,
    deleteDiscordIntegrationHandler,
    fetchDiscordMessagesHandler,
    startDiscordGatewayHandler,
    stopDiscordGatewayHandler,
    getDiscordGatewayStatusHandler,
    generateStripeCheckoutHandler,
    stripeSuccessHandler,
    getSubscriptionHandler,
    syncSubscriptionHandler,
    createPortalSessionHandler,
    cancelStripeSubscriptionHandler,
    reactivateStripeSubscriptionHandler,
    purchaseAdditionalGenerationsHandler,
    confirmAdditionalGenerationsPaymentHandler,
    addCliStatusUpdateItemHandler,
    undoLastCliStatusUpdateItemHandler,
    showCurrentStatusUpdateHandler,
    listRecentStatusUpdatesHandler,
    runScheduleHandler,
    updateUserOnboardingHandler,
    createOnboardingRecommendedAutomationsHandler,
    slackAddIntegrationCallbackHandler,
    discordAddIntegrationCallbackHandler,
    getPublicStatusUpdateHandler,
    shareStatusUpdateHandler,
    getOrganizationUserHandler,
  ],
  {
    getContext: (c) => ({
      db: c.get("db"),
      session: c.get("session"),
      resend: c.get("resend"),
      auth: c.get("auth"),
      rateLimiter: c.get("rateLimiter"),
      anthropicClient: c.get("anthropicClient"),
      openRouterProvider: c.get("openRouterProvider"),
      voyageClient: c.get("voyageClient"),
      githubWebhooks: c.get("githubWebhooks"),
      bucket: { private: c.env.PRIVATE_BUCKET },
      authKv: c.env.AS_PROD_AUTH_KV,
      organization: c.get("organization" as any),
      member: c.get("member" as any),
      discord: c.get("discord"),
      slack: c.get("slack"),
      stripeClient: c.get("stripeClient"),
      stripeConfig: c.get("stripeConfig"),
      webAppUrl: c.env.WEB_APP_URL,
      workflow: c.get("workflow"),
      betterAuthUrl: c.env.BETTER_AUTH_URL,
      github: c.get("github"),
      gitlab: c.get("gitlab"),
    }),
  },
);

export default {
  fetch: typedHandlersApp.fetch,
  queue: queue,
  scheduled: scheduled,
};
export type App = typeof app;
export { DiscordGatewayDurableObject } from "./durable-objects/discord-gateway";
export { DeleteDiscordIntegrationWorkflow } from "./workflows/discord/delete-discord-integration";
export { FetchDiscordMessagesWorkflow } from "./workflows/discord/fetch-discord-messages";
export { SyncDiscordWorkflow } from "./workflows/discord/sync-discord";
export { DeleteGithubIntegrationWorkflow } from "./workflows/github/delete-github-integration";
export { SyncGithubWorkflow } from "./workflows/github/sync-github";
export { SyncGitlabWorkflow } from "./workflows/gitlab/sync-gitlab";
export { DeleteGitlabIntegrationWorkflow } from "./workflows/gitlab/delete-gitlab-integration";
export { GenerateStatusUpdatesWorkflow } from "./workflows/schedules/generate-status-updates";
export { PingForUpdatesWorkflow } from "./workflows/schedules/ping-for-updates";
export { SendSummariesWorkflow } from "./workflows/schedules/send-summaries";
export { DeleteSlackIntegrationWorkflow } from "./workflows/slack/delete-slack-integration";
export { SyncSlackWorkflow } from "./workflows/slack/sync-slack";
