import { App } from "@slack/bolt";
import { eq } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../db/schema";

export class SlackBot {
  public app: App;
  private db: Db;

  constructor(botToken: string, signingSecret: string, db: Db) {
    this.db = db;
    this.app = new App({
      token: botToken,
      signingSecret: signingSecret,
      // Disable socket mode and OAuth since we're handling HTTP requests directly
      socketMode: false,
      processBeforeResponse: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Handle slash commands
    this.app.command("/asyncstatus", async ({ command, ack, say, respond }) => {
      await ack();
      
      try {
        console.log("Processing /asyncstatus command:", command);
        
        const userId = command.user_id;
        const text = command.text || "Working on something...";
        
        // Post a public message to the channel
        await say(`<@${userId}> set their status: ${text}`);
        
        console.log("Successfully processed /asyncstatus command");
      } catch (error) {
        console.error("Error processing /asyncstatus command:", error);
        // Send an ephemeral error message using respond
        await respond({
          text: "Sorry, there was an error processing your status update.",
          response_type: "ephemeral"
        });
      }
    });

    // Handle app mentions
    this.app.event("app_mention", async ({ event, say }) => {
      try {
        console.log("App mention received:", event);
        await say({
          text: `Hi <@${event.user}>! Use \`/asyncstatus [your status]\` to update your status.`,
          channel: event.channel
        });
      } catch (error) {
        console.error("Error handling app mention:", error);
      }
    });
  }

  async processEvent(event: any): Promise<any> {
    try {
      console.log("Processing Slack event:", event.type);
      
      if (event.type === 'command' && event.command) {
        // Handle slash command
        return await this.handleSlashCommand(event.command);
      }
      
      // For other events, let Bolt handle them
      return await this.app.processEvent({
        ...event,
        body: event,
        headers: {}
      });
    } catch (error) {
      console.error("Error in processEvent:", error);
      throw error;
    }
  }

  private async handleSlashCommand(command: any): Promise<any> {
    try {
      if (command.command === "/asyncstatus") {
        const userId = command.user_id;
        const text = command.text || "Working on something...";
        
        // Here you could save the status to your database
        // For now, just return a success response
        return {
          response_type: "in_channel",
          text: `<@${userId}> set their status: ${text}`
        };
      }
      
      return {
        response_type: "ephemeral",
        text: "Unknown command"
      };
    } catch (error) {
      console.error("Error handling slash command:", error);
      return {
        response_type: "ephemeral",
        text: "Sorry, there was an error processing your command."
      };
    }
  }

  async getUserInfo(userId: string) {
    try {
      const result = await this.app.client.users.info({
        user: userId
      });
      return result.user;
    } catch (error) {
      console.error("Error getting user info:", error);
      return null;
    }
  }

  async postMessage(channel: string, text: string) {
    try {
      const result = await this.app.client.chat.postMessage({
        channel,
        text
      });
      return result;
    } catch (error) {
      console.error("Error posting message:", error);
      throw error;
    }
  }

  async listUsers() {
    try {
      const result = await this.app.client.users.list();
      return result.members || [];
    } catch (error) {
      console.error("Error listing users:", error);
      return [];
    }
  }
}

export function createSlackBot(botToken: string, signingSecret: string, db: Db): SlackBot | null {
  try {
    if (!botToken || !signingSecret) {
      console.warn("Slack credentials not provided, Slack integration disabled");
      return null;
    }
    
    console.log("Creating Slack bot instance");
    return new SlackBot(botToken, signingSecret, db);
  } catch (error) {
    console.error("Failed to create Slack bot:", error);
    return null;
  }
}