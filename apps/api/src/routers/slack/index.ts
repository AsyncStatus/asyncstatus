import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

import * as schema from "../../db/schema";
import {
  AsyncStatusBadRequestError,
  AsyncStatusForbiddenError,
  AsyncStatusNotFoundError,
  AsyncStatusUnexpectedApiError,
} from "../../errors";
import type { HonoEnv, HonoEnvWithOrganization } from "../../lib/env";
import { requiredOrganization, requiredSession } from "../../lib/middleware";
import { exchangeSlackCode, verifySlackRequest } from "../../lib/slack";
import { zSlackChallengeSchema, zSlackCommandSchema, zSlackEventSchema, zSlackIntegrationCreate } from "../../schema/slack";

// Main Slack router
export const slackRouter = new Hono<HonoEnv>()
  // OAuth endpoints - public-facing for Slack OAuth flow
  .get("/oauth", async (c) => {
    const { code, state } = c.req.query();
    
    if (!code || !state) {
      throw new AsyncStatusBadRequestError({
        message: "Missing required parameters",
      });
    }
    
    try {
      // Parse the state to get the organization ID
      const parsedState = JSON.parse(Buffer.from(state, 'base64').toString());
      const { organizationId } = parsedState;
      
      if (!organizationId) {
        throw new AsyncStatusBadRequestError({
          message: "Invalid state parameter",
        });
      }
      
      // Exchange the code for access token
      const redirectUri = `${c.env.WEB_APP_URL}/slack/oauth`;
      const slackResponse = await exchangeSlackCode(code, redirectUri, c.env);
      
      if (!slackResponse.ok) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to authenticate with Slack",
        });
      }
      
      // Check if this workspace is already connected
      const existingWorkspace = await c.var.db.query.slackWorkspace.findFirst({
        where: eq(schema.slackWorkspace.teamId, slackResponse.team.id),
      });
      
      let workspaceId: string;
      
      // Start a transaction to create or update the workspace and integration
      await c.var.db.transaction(async (tx) => {
        // If workspace exists, update it
        if (existingWorkspace) {
          workspaceId = existingWorkspace.id;
          
          await tx
            .update(schema.slackWorkspace)
            .set({
              teamName: slackResponse.team.name,
              botUserId: slackResponse.bot_user_id,
              botAccessToken: slackResponse.access_token,
            })
            .where(eq(schema.slackWorkspace.id, workspaceId));
        } else {
          // Create a new workspace
          workspaceId = generateId();
          
          await tx.insert(schema.slackWorkspace).values({
            id: workspaceId,
            teamId: slackResponse.team.id,
            teamName: slackResponse.team.name,
            botUserId: slackResponse.bot_user_id,
            botAccessToken: slackResponse.access_token,
          });
        }
        
        // Check if there's already an integration for this organization+workspace
        const existingIntegration = await tx.query.slackIntegration.findFirst({
          where: and(
            eq(schema.slackIntegration.organizationId, organizationId),
            eq(schema.slackIntegration.slackWorkspaceId, workspaceId)
          ),
        });
        
        // If integration doesn't exist, create it
        if (!existingIntegration && c.var.session?.user) {
          await tx.insert(schema.slackIntegration).values({
            id: generateId(),
            organizationId,
            slackWorkspaceId: workspaceId,
            createdById: c.var.session.user.id,
            settings: {},
          });
        }
      });
      
      // Redirect to the app with success message
      return c.redirect(`${c.env.WEB_APP_URL}/organization/${organizationId}/settings/integrations?slackSuccess=true`);
    } catch (error) {
      console.error("Slack OAuth error:", error);
      return c.redirect(`${c.env.WEB_APP_URL}/error?message=Failed to connect Slack workspace`);
    }
  })
  
  // Events API endpoint (for Slack events and interactions)
  .post("/events", async (c) => {
    // For URL verification, we need to respond immediately with the challenge
    const body = await c.req.json();
    
    // Handle URL verification challenge (Slack sends this when you configure the Events API)
    if (body.type === 'url_verification') {
      console.log("Received Slack verification challenge:", body.challenge);
      return c.json({ challenge: body.challenge });
    }
    
    // Continue with the rest of the events handling
    // Verify the request is from Slack for non-challenge requests
    if (!(await verifySlackRequest(c.req, c.env))) {
      return c.text("Unauthorized", 401);
    }
    
    // Handle regular events
    const eventResult = zSlackEventSchema.safeParse(body);
    if (eventResult.success) {
      // Process the event asynchronously
      c.executionCtx.waitUntil(processSlackEvent(eventResult.data, c.var.db));
      return c.text("OK");
    }
    
    return c.text("OK");
  })
  
  // Slash commands endpoint
  .post("/commands", async (c) => {
    // Verify the request is from Slack
    if (!verifySlackRequest(c.req, c.env.SLACK_SIGNING_SECRET)) {
      return c.text("Unauthorized", 401);
    }
    
    const formData = await c.req.formData();
    const commandData: Record<string, string> = {};
    
    // Convert form data to object
    for (const [key, value] of formData.entries()) {
      commandData[key] = value.toString();
    }
    
    const commandResult = zSlackCommandSchema.safeParse(commandData);
    if (!commandResult.success) {
      return c.json({
        response_type: "ephemeral",
        text: "Invalid command format",
      });
    }
    
    const { command, text, team_id, user_id, channel_id } = commandResult.data;
    
    // Find the workspace for this team
    const workspace = await c.var.db.query.slackWorkspace.findFirst({
      where: eq(schema.slackWorkspace.teamId, team_id),
      with: {
        integrations: {
          with: {
            organization: true,
          },
        },
      },
    });
    
    if (!workspace || workspace.integrations.length === 0) {
      return c.json({
        response_type: "ephemeral",
        text: "This workspace is not connected to AsyncStatus",
      });
    }
    
    // Handle different commands
    switch (command) {
      case "/asyncstatus":
        return handleAsyncStatusCommand(text, workspace, commandResult.data, c);
      default:
        return c.json({
          response_type: "ephemeral",
          text: "Unknown command",
        });
    }
  });

// Organization-specific Slack integrations router
export const organizationSlackRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredOrganization)
  .use(requiredSession)
  .get("/:idOrSlug/integrations/slack", async (c) => {
    const integrations = await c.var.db.query.slackIntegration.findMany({
      where: eq(schema.slackIntegration.organizationId, c.var.organization.id),
      with: {
        workspace: true,
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return c.json({ integrations });
  })
  .get("/:idOrSlug/integrations/slack/auth-url", async (c) => {
    const state = Buffer.from(
      JSON.stringify({ organizationId: c.var.organization.id })
    ).toString("base64");
    
    const slackAuthUrl = new URL("https://slack.com/oauth/v2/authorize");
    slackAuthUrl.searchParams.append("client_id", c.env.SLACK_CLIENT_ID);
    slackAuthUrl.searchParams.append("scope", "commands,chat:write,incoming-webhook");
    slackAuthUrl.searchParams.append("redirect_uri", `${c.env.WEB_APP_URL}/slack/oauth`);
    slackAuthUrl.searchParams.append("state", state);
    
    return c.json({ url: slackAuthUrl.toString() });
  })
  .delete("/:idOrSlug/integrations/slack/:integrationId", async (c) => {
    const integrationId = c.req.param("integrationId");
    
    const integration = await c.var.db.query.slackIntegration.findFirst({
      where: and(
        eq(schema.slackIntegration.id, integrationId),
        eq(schema.slackIntegration.organizationId, c.var.organization.id)
      ),
    });
    
    if (!integration) {
      throw new AsyncStatusNotFoundError({
        message: "Slack integration not found",
      });
    }
    
    // Check permissions (only admin or owner can remove)
    if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
      throw new AsyncStatusForbiddenError({
        message: "You don't have permission to remove integrations",
      });
    }
    
    await c.var.db
      .delete(schema.slackIntegration)
      .where(eq(schema.slackIntegration.id, integrationId));
    
    return c.json({ success: true });
  });

// Helper functions
async function processSlackEvent(event: any, db: any) {
  // Process different event types here
  console.log("Processing Slack event:", event);
  
  // Implementation would handle various event types
  // For example: message events, reaction events, etc.
}

async function handleAsyncStatusCommand(text: string, workspace: any, commandData: any, c: any) {
  // Handle different subcommands
  const [subcommand, ...args] = text.trim().split(/\s+/);
  
  switch (subcommand?.toLowerCase()) {
    case "help":
      return c.json({
        response_type: "ephemeral",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*AsyncStatus Commands*",
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "• `/asyncstatus help` - Show this help message\n• `/asyncstatus status` - Show current status",
            },
          },
        ],
      });
      
    case "status":
      // Get the organization from the first integration
      const orgId = workspace.integrations[0].organization.id;
      
      // Get status information from the database
      // This is just a placeholder - implement according to your app's logic
      const statusInfo = {
        organization: workspace.integrations[0].organization.name,
        // Add more status information here
      };
      
      return c.json({
        response_type: "ephemeral",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${statusInfo.organization} Status*`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Status information would be shown here",
            },
          },
        ],
      });
      
    default:
      return c.json({
        response_type: "ephemeral",
        text: "Unknown command. Try `/asyncstatus help` for available commands.",
      });
  }
}
