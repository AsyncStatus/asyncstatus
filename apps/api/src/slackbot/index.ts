import { App } from '@slack/bolt';
import type { HonoEnv } from '../lib/env';
import { eq } from 'drizzle-orm';
import { user, member, statusUpdate, statusUpdateItem } from '../db/schema';
import { nanoid } from 'nanoid';
import type { Db } from '../db';

export interface SlackbotConfig {
  token: string;
  signingSecret: string;
  db?: Db;
}

export type ReturnType = {
  app: App;
  processEvent: (body: any) => Promise<boolean>;
};

export function createSlackbot(config: SlackbotConfig): ReturnType {
  const app = new App({
    token: config.token,
    signingSecret: config.signingSecret,
    socketMode: false, // Don't use socket mode
    processBeforeResponse: true,
  });

  // Store the db instance in a variable closure that can be accessed by handlers
  const dbInstance = config.db;

  // Listen for app mention events
  app.event('app_mention', async ({ event, say }) => {
    await say(`You mentioned me, <@${event.user}>!`);
  });

  // Handle interactions with buttons
  app.action('button_click', async ({ body, ack, client }) => {
    // Acknowledge the action
    await ack();
    // Use chat.postMessage instead of say since say is not available in this context
    await client.chat.postMessage({
      channel: body.channel?.id || body.user.id,
      text: `<@${body.user.id}> clicked a button`
    });
  });

  // Handle slash command
  app.command('/asyncstatus', async ({ command, ack, respond }) => {
    console.log("Status command received:", command);
    // Acknowledge command request
    await ack();

    try {
      // Get db from the closure
      const db = dbInstance;

      if (!db) {
        console.error("Database not available in Slack client context");
        await respond({
          response_type: 'ephemeral',
          text: `Error: Database connection is not available. Please try again later.`,
        });
        return;
      }

      // Check if the Slack user is associated with an AsyncStatus user
      const slackUser = command.user_id;
      
      // Find member with the given slack username
      const associatedMember = await db.query.member.findFirst({
        where: eq(member.slackUsername, slackUser),
        with: {
          user: true,
          organization: true
        },
      });

      if (!associatedMember) {
        await respond({
          response_type: 'ephemeral', // Only visible to the user
          text: `Error: Your Slack account is not connected to any AsyncStatus account. Please connect your account in the organization settings.`,
        });
        return;
      }
      
      // Create status update
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const statusUpdateId = nanoid();
      
      // Insert status update
      await db.insert(statusUpdate).values({
        id: statusUpdateId,
        memberId: associatedMember.id,
        teamId: null, // No team associated when coming from Slack
        effectiveFrom: now,
        effectiveTo: tomorrow,
        mood: "neutral",
        emoji: "✅",
        isDraft: false, // Published immediately
        createdAt: now,
        updatedAt: now,
      });
      
      // Insert status update item
      await db.insert(statusUpdateItem).values({
        id: nanoid(),
        statusUpdateId: statusUpdateId,
        content: command.text || "No status provided",
        isBlocker: false,
        order: 0,
        createdAt: now,
        updatedAt: now,
      });

      await respond({
        response_type: 'in_channel', // Visible to all users in the channel
        text: `<@${command.user_id}> set their status: ${command.text || "No status provided"}`,
      });
    } catch (error) {
      console.error("Error saving status update:", error);
      await respond({
        response_type: 'ephemeral',
        text: `Error: Something went wrong saving your status update. Please try again later.`,
      });
    }
  });

  // Add a message shortcut (message context menu)
  app.shortcut('save_message', async ({ shortcut, ack, client }) => {
    // Acknowledge the shortcut request
    await ack();

    try {
      // Call views.open with the built-in client
      await client.views.open({
        // Pass a valid trigger_id within 3 seconds of receiving it
        trigger_id: shortcut.trigger_id,
        // View payload
        view: {
          type: 'modal',
          // View identifier
          callback_id: 'save_message_view',
          title: {
            type: 'plain_text',
            text: 'Save this message'
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Would you like to save this message to your notes?'
              }
            }
          ],
          submit: {
            type: 'plain_text',
            text: 'Save'
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  });

  // Helper function to send a message using response_url which is more reliable
  async function respondViaResponseUrl(responseUrl: string, message: { text: string; response_type?: string }) {
    if (!responseUrl) {
      console.warn("No response_url provided for message");
      return false;
    }

    try {
      const response = await fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.text,
          response_type: message.response_type || 'ephemeral'
        }),
      });

      if (!response.ok) {
        console.error(`Error sending message to response_url: ${response.status} ${response.statusText}`);
        return false;
      }

      const responseData = await response.json();
      console.log("Response URL response:", responseData);
      return true;
    } catch (error) {
      console.error("Error using response_url:", error);
      return false;
    }
  }

  return {
    app,
    // Instead of starting a server, provide a method to process events
    processEvent: async (body: any) => {
      try {
        console.log("Processing Slack event:", JSON.stringify(body, null, 2));
        
        // Special handling for commands
        if (body.type === 'command') {
          console.log("Processing command directly");
          const { command } = body;
          
          if (command.command === '/asyncstatus') {
            try {
              // If we have a response_url, use it (more reliable than chat.postMessage)
              if (command.response_url) {
                console.log("Using response_url to respond to command");
                const success = await respondViaResponseUrl(command.response_url, {
                  text: `<@${command.user_id}> set their status: ${command.text || "No status provided"}`,
                  response_type: 'in_channel'
                });
                
                if (success) {
                  console.log("Successfully responded via response_url");
                  return true;
                }
                
                console.log("Failed to respond via response_url, falling back to chat.postMessage");
              }
              
              // Only attempt to post a message if we have a valid channel_id
              if (command.channel_id) {
                console.log("Using chat.postMessage to respond to command");
                // Use the WebClient to respond to Slack
                await app.client.chat.postMessage({
                  token: config.token,
                  channel: command.channel_id,
                  text: `<@${command.user_id}> set their status: ${command.text || "No status provided"}`
                });
                
                console.log("Successfully sent message via chat.postMessage");
                return true;
              } else {
                console.log("Skipping chat.postMessage due to missing channel_id");
              }
              
              // If we got here, we couldn't send the message
              console.warn("Could not send message via either method");
              return false;
            } catch (error) {
              console.error("Error posting message to Slack:", error);
              // Still return true to indicate we handled the command
              return true;
            }
          }
          
          return false;
        }
        
        // Process other Slack events through the app's middleware stack
        await app.processEvent(body);
        return true;
      } catch (error) {
        console.error('Error processing Slack event:', error);
        return false;
      }
    }
  };
}

export function initSlackbot(env: HonoEnv['Bindings']): ReturnType | null {
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_SIGNING_SECRET) {
    console.warn('Slack bot token or signing secret not provided. Skipping slackbot initialization.');
    return null;
  }

  const config: SlackbotConfig = {
    token: env.SLACK_BOT_TOKEN,
    signingSecret: env.SLACK_SIGNING_SECRET,
  };

  return createSlackbot(config);
} 