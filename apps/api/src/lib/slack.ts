import { WebClient } from "@slack/web-api";

export interface SlackConfig {
  botToken: string;
  signingSecret: string;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  display_name?: string;
  email?: string;
  is_bot: boolean;
  deleted: boolean;
}

export interface SlackMessage {
  channel: string;
  text: string;
  user?: string;
  ts?: string;
}

export interface SlackCommandPayload {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

export interface StatusUpdatePayload {
  userId: string;
  userName: string;
  status: string;
  channelId: string;
  teamId: string;
}

// Initialize Slack Web API client
export function createSlackClient(config: SlackConfig): WebClient {
  return new WebClient(config.botToken);
}

// Verify Slack request signature
export async function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  body: string,
  signature: string
): Promise<boolean> {
  try {
    const crypto = await import("crypto");
    const time = Math.floor(new Date().getTime() / 1000);
    
    // Request is older than 5 minutes
    if (Math.abs(time - parseInt(timestamp)) > 300) {
      return false;
    }

    const hmac = crypto.createHmac("sha256", signingSecret);
    const [version, hash] = signature.split("=");
    
    hmac.update(`${version}:${timestamp}:${body}`);
    const expectedHash = hmac.digest("hex");
    
    return hash === expectedHash;
  } catch (error) {
    console.error("Error verifying Slack signature:", error);
    return false;
  }
}

// Parse slash command payload
export function parseSlashCommand(body: string): SlackCommandPayload {
  const params = new URLSearchParams(body);
  return {
    token: params.get("token") || "",
    team_id: params.get("team_id") || "",
    team_domain: params.get("team_domain") || "",
    channel_id: params.get("channel_id") || "",
    channel_name: params.get("channel_name") || "",
    user_id: params.get("user_id") || "",
    user_name: params.get("user_name") || "",
    command: params.get("command") || "",
    text: params.get("text") || "",
    response_url: params.get("response_url") || "",
    trigger_id: params.get("trigger_id") || "",
  };
}

// Get user information from Slack
export async function getSlackUser(client: WebClient, userId: string): Promise<SlackUser | null> {
  try {
    const result = await client.users.info({ user: userId });
    
    if (!result.ok || !result.user) {
      return null;
    }
    
    const user = result.user as any;
    return {
      id: user.id,
      name: user.name,
      real_name: user.real_name,
      display_name: user.profile?.display_name,
      email: user.profile?.email,
      is_bot: user.is_bot || false,
      deleted: user.deleted || false,
    };
  } catch (error) {
    console.error("Error getting Slack user:", error);
    return null;
  }
}

// List all users in workspace
export async function listSlackUsers(client: WebClient): Promise<SlackUser[]> {
  try {
    const result = await client.users.list();
    
    if (!result.ok || !result.members) {
      return [];
    }
    
    return result.members
      .filter((user: any) => !user.deleted && !user.is_bot && user.name !== "slackbot")
      .map((user: any) => ({
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        display_name: user.profile?.display_name,
        email: user.profile?.email,
        is_bot: user.is_bot || false,
        deleted: user.deleted || false,
      }));
  } catch (error) {
    console.error("Error listing Slack users:", error);
    return [];
  }
}

// Post message to Slack channel
export async function postSlackMessage(
  client: WebClient,
  channel: string,
  text: string,
  options?: { thread_ts?: string; ephemeral?: boolean; user?: string }
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  try {
    const result = await client.chat.postMessage({
      channel,
      text,
      thread_ts: options?.thread_ts,
    });
    
    return {
      ok: result.ok || false,
      ts: result.ts,
      error: result.error,
    };
  } catch (error) {
    console.error("Error posting Slack message:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Post ephemeral message (only visible to specific user)
export async function postEphemeralMessage(
  client: WebClient,
  channel: string,
  user: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await client.chat.postEphemeral({
      channel,
      user,
      text,
    });
    
    return {
      ok: result.ok || false,
      error: result.error,
    };
  } catch (error) {
    console.error("Error posting ephemeral message:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send response to slash command
export async function respondToSlashCommand(
  responseUrl: string,
  text: string,
  responseType: "in_channel" | "ephemeral" = "ephemeral"
): Promise<boolean> {
  try {
    const response = await fetch(responseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        response_type: responseType,
        text,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Error responding to slash command:", error);
    return false;
  }
}

// Format status update message
export function formatStatusMessage(payload: StatusUpdatePayload): string {
  return `<@${payload.userId}> set their status: ${payload.status}`;
}

// Validate Slack configuration
export function validateSlackConfig(config: Partial<SlackConfig>): config is SlackConfig {
  return !!(config.botToken && config.signingSecret);
}