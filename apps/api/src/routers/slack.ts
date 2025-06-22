import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { HonoEnv } from "../lib/env";
import {
  createSlackClient,
  parseSlashCommand,
  postEphemeralMessage,
  respondToSlashCommand,
  verifySlackSignature,
  type StatusUpdatePayload,
} from "../lib/slack";
import { processStatusUpdate } from "../workflows/slack/process-status-update";

export const slackRouter = new Hono<HonoEnv>()
  .post("/events", async (c) => {
    try {
      console.log("==== SLACK EVENT RECEIVED ====");
      
      const slackConfig = c.get("slackConfig");
      if (!slackConfig) {
        console.warn("Slack integration not configured");
        return c.json({ ok: true }, 200);
      }
      
      // Get raw body for signature verification
      const rawBody = await c.req.text();
      const timestamp = c.req.header("x-slack-request-timestamp") || "";
      const signature = c.req.header("x-slack-signature") || "";
      
      // Verify Slack signature
      const isValid = await verifySlackSignature(
        slackConfig.signingSecret,
        timestamp,
        rawBody,
        signature
      );
      
      if (!isValid) {
        console.error("Invalid Slack signature");
        return c.json({ error: "Invalid signature" }, 401);
      }
      
      const body = JSON.parse(rawBody);
      console.log("Event type:", body.type);
      
      // Respond to Slack Events API URL verification
      if (body.type === "url_verification") {
        console.log("Processing URL verification challenge");
        return c.json({ challenge: body.challenge });
      }
      
      // Handle app mentions
      if (body.type === "event_callback" && body.event?.type === "app_mention") {
        const event = body.event;
        const client = createSlackClient(slackConfig);
        
        await postEphemeralMessage(
          client,
          event.channel,
          event.user,
          `Hi <@${event.user}>! Use \`/asyncstatus [your status]\` to update your status.`
        );
      }
      
      return c.json({ ok: true });
    } catch (error) {
      console.error("Error in /events endpoint:", error);
      return c.json({ ok: true }, 200); // Always return 200 to prevent Slack retries
    }
  })
  .post("/commands", async (c) => {
    try {
      console.log("==== SLACK COMMAND RECEIVED ====");
      
      const slackConfig = c.get("slackConfig");
      if (!slackConfig) {
        return c.json({
          response_type: "ephemeral",
          text: "Slack integration is not configured."
        });
      }
      
      const rawBody = await c.req.text();
      const timestamp = c.req.header("x-slack-request-timestamp") || "";
      const signature = c.req.header("x-slack-signature") || "";
      
      // Verify Slack signature
      const isValid = await verifySlackSignature(
        slackConfig.signingSecret,
        timestamp,
        rawBody,
        signature
      );
      
      if (!isValid) {
        console.error("Invalid Slack signature for command");
        return c.json({
          response_type: "ephemeral",
          text: "Authentication failed."
        });
      }
      
      const commandPayload = parseSlashCommand(rawBody);
      console.log("Command:", commandPayload.command, "Text:", commandPayload.text);
      
      if (commandPayload.command === "/asyncstatus") {
        const status = commandPayload.text.trim();
        
        if (!status) {
          return c.json({
            response_type: "ephemeral",
            text: "Please provide a status message. Example: `/asyncstatus Working on the Q2 report`"
          });
        }
        
        // Create status update payload
        const statusUpdate: StatusUpdatePayload = {
          userId: commandPayload.user_id,
          userName: commandPayload.user_name,
          status: status,
          channelId: commandPayload.channel_id,
          teamId: commandPayload.team_id,
        };
        
        try {
          // Process the status update using the workflow
          const db = c.get("db");
          
          // For now, we'll use a default organization ID
          // In a real implementation, you'd determine this from the Slack team or user context
          const organizationId = "default-org"; // This should be determined dynamically
          
          // Trigger the workflow
          const result = await processStatusUpdate(
            {
              statusUpdate,
              slackConfig,
              organizationId,
            },
            db
          );
          
          if (result.success) {
            // Immediate response to acknowledge the command
            return c.json({
              response_type: "in_channel",
              text: `<@${commandPayload.user_id}> set their status: ${status}`
            });
          } else {
            console.error("Workflow failed:", result.error);
            return c.json({
              response_type: "ephemeral",
              text: "Sorry, there was an error processing your status update."
            });
          }
        } catch (workflowError) {
          console.error("Error triggering workflow:", workflowError);
          
          // Fallback: just post the message without saving to database
          const client = createSlackClient(slackConfig);
          const message = `<@${commandPayload.user_id}> set their status: ${status}`;
          
          try {
            await postEphemeralMessage(client, commandPayload.channel_id, commandPayload.user_id, message);
            
            return c.json({
              response_type: "in_channel",
              text: message
            });
          } catch (slackError) {
            console.error("Fallback Slack post failed:", slackError);
            return c.json({
              response_type: "ephemeral",
              text: "Sorry, there was an error processing your command."
            });
          }
        }
      }
      
      throw new HTTPException(400, { message: "Unknown command" });
    } catch (error) {
      console.error("Error in /commands endpoint:", error);
      return c.json({ 
        response_type: "ephemeral",
        text: "Sorry, something went wrong processing your command."
      }, 200);
    }
  }); 