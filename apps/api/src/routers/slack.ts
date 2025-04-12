import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { HonoEnv } from "../lib/env";

export const slackRouter = new Hono<HonoEnv>()
  .post("/events", async (c) => {
    try {
      console.log("==== SLACK EVENT RECEIVED ====");
      console.log("Headers:", JSON.stringify(c.req.raw.headers, null, 2));
      
      // Get raw body for debugging
      const rawBody = await c.req.text();
      console.log("Raw body:", rawBody);
      
      // Parse the body again
      const body = JSON.parse(rawBody);
      console.log("Parsed body:", JSON.stringify(body, null, 2));
      
      const slackbot = c.get("slackbot");
      console.log("Slackbot available:", !!slackbot);
      
      // Respond to Slack Events API URL verification
      if (body.type === "url_verification") {
        console.log("Processing URL verification challenge");
        return c.json({ challenge: body.challenge });
      }
      
      // Handle other events using the slackbot
      if (slackbot) {
        try {
          console.log("Forwarding event to slackbot processor");
          await slackbot.processEvent(body);
          console.log("Event processing complete");
        } catch (slackError) {
          console.error("Error in slackbot.processEvent:", slackError);
        }
      } else {
        console.warn("No slackbot instance available to process event");
      }
      
      console.log("Returning success response");
      return c.json({ success: true });
    } catch (error) {
      console.error("Error in /events endpoint:", error);
      // Return 200 even on error to prevent Slack from retrying
      return c.json({ error: "An error occurred processing the event", ok: true }, 200);
    }
  })
  .post("/commands", async (c) => {
    try {
      console.log("==== SLACK COMMAND RECEIVED ====");
      console.log("Headers:", JSON.stringify(c.req.raw.headers, null, 2));
      
      // Debug: log raw request
      const rawBody = await c.req.text();
      console.log("Raw request body:", rawBody);
      
      // Parse the form data from raw body (since formData() might be failing)
      const params = new URLSearchParams(rawBody);
      
      // Convert URLSearchParams to object for easier debugging
      const paramObj: Record<string, string> = {};
      for (const [key, value] of params.entries()) {
        paramObj[key] = value;
      }
      console.log("All command parameters:", JSON.stringify(paramObj, null, 2));
      
      const command = params.get("command") || "";
      const text = params.get("text") || "";
      const userId = params.get("user_id") || "";
      const teamId = params.get("team_id") || "";
      const channelId = params.get("channel_id") || "";
      const responseUrl = params.get("response_url") || "";
      
      console.log("Command details:", { command, text, userId, teamId, channelId });
      console.log("Response URL:", responseUrl);
      
      const slackbot = c.get("slackbot");
      console.log("Slackbot available:", !!slackbot);
      
      // If we have a slackbot instance, use it to process the command
      if (slackbot && command === "/asyncstatus") {
        try {
          // Create a command payload that Bolt can understand
          const commandPayload = {
            command,
            text,
            user_id: userId,
            team_id: teamId,
            channel_id: channelId,
            response_url: responseUrl,
            api_app_id: params.get("api_app_id") || "",
            token: params.get("token") || "",
            trigger_id: params.get("trigger_id") || "",
          };
          
          console.log("Attempting to process command with slackbot");
          const result = await slackbot.processEvent({
            type: 'command',
            command: commandPayload
          });
          console.log("Command processing result:", result);
          
          // Return an immediate 200 response to Slack
          return c.json({
            response_type: "in_channel",
            text: `Processing your status update: ${text || "No status provided"}`,
          });
        } catch (slackbotError) {
          console.error("Error processing with slackbot:", slackbotError);
          // Return an error message to the user
          return c.json({
            response_type: "ephemeral",
            text: "Sorry, there was an error processing your command. Please try again later."
          });
        }
      }
      
      // Handle slash commands as a fallback
      if (command === "/asyncstatus" || command === "/status") {
        console.log("Using fallback command handler");
        return c.json({
          response_type: "in_channel", // visible to all users in the channel
          text: `<@${userId}> set their status: ${text || "No status provided"}`,
        });
      }
      
      throw new HTTPException(400, { message: "Unknown command" });
    } catch (error) {
      console.error("Error in /commands endpoint:", error);
      // Return a user-friendly error to Slack
      return c.json({ 
        response_type: "ephemeral",
        text: "Sorry, something went wrong processing your command."
      }, 200);
    }
  }); 