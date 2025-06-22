import { App, type SlackEventMiddlewareArgs, type SlashCommand } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import type { Db } from "../db";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import dayjs from "dayjs";
import { generateId } from "better-auth";

export class SlackBot {
  public app: App;
  private db: Db;
  private webAppUrl: string;

  constructor(config: {
    token: string;
    signingSecret: string;
    db: Db;
    webAppUrl: string;
  }) {
    this.db = config.db;
    this.webAppUrl = config.webAppUrl;
    
    // Initialize the Slack app with minimal configuration
    // We'll handle events manually through our API endpoints
    this.app = new App({
      token: config.token,
      signingSecret: config.signingSecret,
      // Disable built-in server since we're using Hono
      port: undefined,
      // Disable socket mode
      socketMode: false,
    });
  }

  // Process events from our API endpoint
  async processEvent(body: any): Promise<void> {
    // Handle different event types
    if (body.type === "event_callback") {
      const event = body.event;
      
      if (event.type === "app_mention") {
        await this.handleAppMention(event);
      } else if (event.type === "message" && !event.subtype) {
        // Handle regular messages if needed
      }
    } else if (body.type === "command") {
      // Handle slash commands
      await this.handleSlashCommand(body.command);
    }
  }

  // Handle app mentions
  private async handleAppMention(event: any): Promise<void> {
    try {
      const { text, user, channel } = event;
      
      // Extract the message after the mention
      const mentionRegex = /<@[A-Z0-9]+>/g;
      const messageText = text.replace(mentionRegex, "").trim();
      
      // Respond to the mention
      await this.app.client.chat.postMessage({
        channel,
        text: `Hi <@${user}>! You mentioned me with: "${messageText}"`,
      });
    } catch (error) {
      console.error("Error handling app mention:", error);
    }
  }

  // Handle slash commands
  private async handleSlashCommand(command: SlashCommand): Promise<void> {
    const { command: cmd, text, user_id, team_id, channel_id, response_url } = command;
    
    if (cmd === "/asyncstatus") {
      try {
        // Parse the command text
        const statusText = text.trim();
        
        if (!statusText) {
          // Send help message
          await this.sendResponse(response_url, {
            response_type: "ephemeral",
            text: "Please provide a status update. Usage: `/asyncstatus Working on the Q2 report`",
          });
          return;
        }

        // Find the member by Slack user ID
        const member = await this.db.query.member.findFirst({
          where: eq(schema.member.slackUsername, user_id),
          with: { 
            user: true,
            organization: {
              with: {
                slackIntegration: true
              }
            }
          },
        });

        if (!member) {
          await this.sendResponse(response_url, {
            response_type: "ephemeral",
            text: "Your Slack account is not linked to AsyncStatus. Please link your account in the AsyncStatus app first.",
          });
          return;
        }

        // Create a new status update
        const now = dayjs();
        const statusUpdateId = generateId();
        
        await this.db.transaction(async (tx) => {
          // Create the status update
          await tx.insert(schema.statusUpdate).values({
            id: statusUpdateId,
            memberId: member.id,
            organizationId: member.organizationId,
            effectiveFrom: now.startOf("week").toDate(),
            effectiveTo: now.endOf("week").toDate(),
            mood: "neutral",
            notes: statusText,
            isDraft: false,
            createdAt: now.toDate(),
            updatedAt: now.toDate(),
          });

          // Create a status update item
          await tx.insert(schema.statusUpdateItem).values({
            id: generateId(),
            statusUpdateId,
            content: statusText,
            isBlocker: false,
            isInProgress: true,
            order: 0,
            createdAt: now.toDate(),
            updatedAt: now.toDate(),
          });
        });

        // Use organization-specific token if available
        const client = member.organization.slackIntegration 
          ? new (await import("@slack/web-api")).WebClient(member.organization.slackIntegration.botAccessToken)
          : this.app.client;
        
        // Post to the channel
        await client.chat.postMessage({
          channel: channel_id,
          text: `<@${user_id}> updated their status: ${statusText}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*<@${user_id}> updated their status*`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `> ${statusText}`,
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `View in AsyncStatus: <${this.webAppUrl}/${member.organization.slug}/status/${statusUpdateId}|Open>`,
                },
              ],
            },
          ],
        });

        // Send acknowledgment
        await this.sendResponse(response_url, {
          response_type: "ephemeral",
          text: "✅ Status update posted successfully!",
        });
      } catch (error) {
        console.error("Error handling /asyncstatus command:", error);
        await this.sendResponse(response_url, {
          response_type: "ephemeral",
          text: "Sorry, there was an error processing your status update. Please try again.",
        });
      }
    }
  }

  // Helper method to send responses to Slack
  private async sendResponse(responseUrl: string, message: any): Promise<void> {
    try {
      await fetch(responseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error("Error sending response to Slack:", error);
    }
  }

  // Get Slack user info
  async getUserInfo(userId: string): Promise<any> {
    try {
      const result = await this.app.client.users.info({ user: userId });
      return result.user;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  }

  // List all users in the workspace
  async listUsers(): Promise<any[]> {
    try {
      const result = await this.app.client.users.list();
      return result.members || [];
    } catch (error) {
      console.error("Error listing users:", error);
      return [];
    }
  }
}