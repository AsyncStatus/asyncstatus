import { DurableObject } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { Bindings } from "../lib/env";

// Discord Gateway API constants
const HEARTBEAT_INTERVAL = 41250; // Default Discord heartbeat interval in ms

// Discord Gateway opcodes
const OPCODES = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  PRESENCE_UPDATE: 3,
  VOICE_STATE_UPDATE: 4,
  RESUME: 6,
  RECONNECT: 7,
  REQUEST_GUILD_MEMBERS: 8,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
} as const;

// Discord Gateway intents
const GATEWAY_INTENTS = {
  GUILDS: 1 << 0,
  GUILD_MEMBERS: 1 << 1,
  GUILD_MESSAGES: 1 << 9,
  GUILD_MESSAGE_REACTIONS: 1 << 10,
  DIRECT_MESSAGES: 1 << 12,
  MESSAGE_CONTENT: 1 << 15,
} as const;

export interface DiscordGatewayPayload {
  op: number;
  d?: Record<string, unknown>;
  s?: number | null;
  t?: string | null;
}

export interface DiscordGatewayState {
  integrationId: string;
  sessionId?: string;
  sequenceNumber?: number;
  isConnected: boolean;
  lastHeartbeat?: number;
  heartbeatInterval?: number;
  resumeGatewayUrl?: string;
  connectionAttempts: number;
  maxReconnectAttempts: number;
  gatewayUrl?: string;
  shards?: number;
}

export interface DiscordGatewayBotResponse {
  url: string;
  shards: number;
  session_start_limit: {
    total: number;
    remaining: number;
    reset_after: number;
    max_concurrency: number;
  };
}

export class DiscordGatewayDurableObject extends DurableObject<Bindings> {
  private webSocket?: WebSocket;
  private heartbeatTimer?: NodeJS.Timeout;
  private state: DiscordGatewayState;

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env);

    // Initialize state from durable storage or defaults
    this.state = {
      integrationId: "",
      isConnected: false,
      connectionAttempts: 0,
      maxReconnectAttempts: 5,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case "/connect":
          return await this.handleConnect(request);
        case "/disconnect":
          return await this.handleDisconnect();
        case "/status":
          return await this.handleStatus();
        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.error("[Discord Gateway DO] Error handling request:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  private async handleConnect(request: Request): Promise<Response> {
    const { integrationId } = (await request.json()) as { integrationId: string };

    if (!integrationId) {
      return new Response("Integration ID required", { status: 400 });
    }

    this.state.integrationId = integrationId;

    // Get Discord integration details
    const db = createDb(this.env);
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.id, integrationId),
    });

    if (!integration) {
      return new Response("Discord integration not found", { status: 404 });
    }

    if (this.state.isConnected) {
      return new Response("Already connected", { status: 200 });
    }

    try {
      await this.connectToGateway(integration.botAccessToken);
      await this.persistState();
      return new Response("Connected to Discord Gateway", { status: 200 });
    } catch (error) {
      console.error("[Discord Gateway DO] Connection failed:", error);
      return new Response("Failed to connect", { status: 500 });
    }
  }

  private async handleDisconnect(): Promise<Response> {
    try {
      await this.disconnectInternal();
      return new Response("Disconnected from Discord Gateway", { status: 200 });
    } catch (error) {
      console.error("[Discord Gateway DO] Disconnect failed:", error);
      return new Response("Failed to disconnect", { status: 500 });
    }
  }

  private async handleStatus(): Promise<Response> {
    return new Response(
      JSON.stringify({
        isConnected: this.state.isConnected,
        sessionId: this.state.sessionId,
        sequenceNumber: this.state.sequenceNumber,
        connectionAttempts: this.state.connectionAttempts,
        lastHeartbeat: this.state.lastHeartbeat,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  private async connectToGateway(botToken: string): Promise<void> {
    console.log("[Discord Gateway DO] Connecting to Discord Gateway...");

    // Get Gateway URL from Discord API if not cached or resuming
    let gatewayUrl = this.state.resumeGatewayUrl;
    if (!gatewayUrl) {
      gatewayUrl = await this.getGatewayUrl(botToken);
    }

    this.webSocket = new WebSocket(gatewayUrl);

    return new Promise((resolve, reject) => {
      if (!this.webSocket) {
        reject(new Error("WebSocket not initialized"));
        return;
      }

      this.webSocket.addEventListener("open", () => {
        console.log("[Discord Gateway DO] WebSocket connected");
        this.state.connectionAttempts = 0;
      });

      this.webSocket.addEventListener("message", async (event) => {
        try {
          await this.handleGatewayMessage(event.data, botToken);
          if (!this.state.isConnected && this.state.sessionId) {
            this.state.isConnected = true;
            resolve();
          }
        } catch (error) {
          console.error("[Discord Gateway DO] Error handling gateway message:", error);
        }
      });

      this.webSocket.addEventListener("close", async (event) => {
        console.log(`[Discord Gateway DO] WebSocket closed: ${event.code} ${event.reason}`);
        this.state.isConnected = false;
        this.clearHeartbeat();

        // Handle reconnection logic based on close code
        if (this.shouldReconnect(event.code)) {
          await this.scheduleReconnect(botToken);
        }
      });

      this.webSocket.addEventListener("error", (event) => {
        console.error("[Discord Gateway DO] WebSocket error:", event);
        reject(new Error("WebSocket connection failed"));
      });
    });
  }

  private async handleGatewayMessage(data: string, botToken: string): Promise<void> {
    const payload: DiscordGatewayPayload = JSON.parse(data);

    // Update sequence number for all dispatch events
    if (payload.s !== null && payload.s !== undefined) {
      this.state.sequenceNumber = payload.s;
    }

    switch (payload.op) {
      case OPCODES.HELLO:
        await this.handleHello(payload.d, botToken);
        break;

      case OPCODES.DISPATCH:
        await this.handleDispatch(payload);
        break;

      case OPCODES.HEARTBEAT_ACK:
        this.state.lastHeartbeat = Date.now();
        console.log("[Discord Gateway DO] Heartbeat acknowledged");
        break;

      case OPCODES.RECONNECT:
        console.log("[Discord Gateway DO] Received reconnect request");
        await this.reconnect(botToken);
        break;

      case OPCODES.INVALID_SESSION:
        console.log("[Discord Gateway DO] Invalid session, will reconnect");
        this.state.sessionId = undefined;
        this.state.sequenceNumber = undefined;
        await this.reconnect(botToken);
        break;

      default:
        console.log(`[Discord Gateway DO] Unhandled opcode: ${payload.op}`);
    }
  }

  private async handleHello(
    data: Record<string, unknown> | undefined,
    botToken: string,
  ): Promise<void> {
    if (!data) return;
    this.state.heartbeatInterval = data.heartbeat_interval as number;

    // Start heartbeat
    this.startHeartbeat();

    // Identify or resume session
    if (this.state.sessionId && this.state.sequenceNumber !== undefined) {
      await this.resumeSession(botToken);
    } else {
      await this.identify(botToken);
    }
  }

  private async identify(botToken: string): Promise<void> {
    const identifyPayload = {
      op: OPCODES.IDENTIFY,
      d: {
        token: botToken,
        intents:
          GATEWAY_INTENTS.GUILDS |
          GATEWAY_INTENTS.GUILD_MEMBERS |
          GATEWAY_INTENTS.GUILD_MESSAGES |
          GATEWAY_INTENTS.GUILD_MESSAGE_REACTIONS |
          GATEWAY_INTENTS.MESSAGE_CONTENT,
        properties: {
          os: "cloudflare",
          browser: "asyncstatus",
          device: "asyncstatus",
        },
      },
    };

    this.send(identifyPayload);
    console.log("[Discord Gateway DO] Sent IDENTIFY");
  }

  private async resumeSession(botToken: string): Promise<void> {
    const resumePayload = {
      op: OPCODES.RESUME,
      d: {
        token: botToken,
        session_id: this.state.sessionId,
        seq: this.state.sequenceNumber,
      },
    };

    this.send(resumePayload);
    console.log("[Discord Gateway DO] Sent RESUME");
  }

  private async handleDispatch(payload: DiscordGatewayPayload): Promise<void> {
    const eventType = payload.t;
    const eventData = payload.d;

    if (eventType === "READY" && eventData) {
      this.state.sessionId = eventData.session_id as string;
      this.state.resumeGatewayUrl = eventData.resume_gateway_url as string;
      console.log("[Discord Gateway DO] Session established:", this.state.sessionId);
      await this.persistState();
      return;
    }

    if (eventType === "RESUMED") {
      console.log("[Discord Gateway DO] Session resumed");
      return;
    }

    // Process other Discord events and send to queue
    if (eventType && eventData) {
      await this.processGatewayEvent(eventType, eventData);
    }
  }

  private async processGatewayEvent(
    eventType: string | null,
    eventData: Record<string, unknown>,
  ): Promise<void> {
    if (!eventType) return;

    // Create event payload compatible with existing Discord webhook queue
    const discordEvent = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: eventData,
    };

    try {
      // Send to existing Discord webhook events queue
      await this.env.DISCORD_WEBHOOK_EVENTS_QUEUE.send(discordEvent, {
        contentType: "json",
      });

      console.log(`[Discord Gateway DO] Queued ${eventType} event`);
    } catch (error) {
      console.error(`[Discord Gateway DO] Failed to queue ${eventType} event:`, error);
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    const interval = this.state.heartbeatInterval || HEARTBEAT_INTERVAL;
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, interval);

    console.log(`[Discord Gateway DO] Started heartbeat with interval: ${interval}ms`);
  }

  private sendHeartbeat(): void {
    const heartbeatPayload = {
      op: OPCODES.HEARTBEAT,
      d: this.state.sequenceNumber || null,
    };

    this.send(heartbeatPayload);
    console.log("[Discord Gateway DO] Sent heartbeat");
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(payload));
    } else {
      console.error("[Discord Gateway DO] Cannot send: WebSocket not connected");
    }
  }

  private shouldReconnect(closeCode: number): boolean {
    // Discord close codes that should trigger reconnection
    const reconnectableCodes = [1000, 1001, 1006, 4000, 4001, 4002, 4003, 4005, 4007, 4008, 4009];
    return (
      reconnectableCodes.includes(closeCode) &&
      this.state.connectionAttempts < this.state.maxReconnectAttempts
    );
  }

  private async scheduleReconnect(botToken: string): Promise<void> {
    this.state.connectionAttempts++;
    const delay = Math.min(1000 * 2 ** this.state.connectionAttempts, 30000); // Exponential backoff, max 30s

    console.log(
      `[Discord Gateway DO] Scheduling reconnect in ${delay}ms (attempt ${this.state.connectionAttempts})`,
    );

    setTimeout(async () => {
      try {
        await this.connectToGateway(botToken);
      } catch (error) {
        console.error("[Discord Gateway DO] Reconnection failed:", error);
      }
    }, delay);
  }

  private async reconnect(botToken: string): Promise<void> {
    console.log("[Discord Gateway DO] Reconnecting...");
    this.clearHeartbeat();

    if (this.webSocket) {
      this.webSocket.close();
    }

    await this.connectToGateway(botToken);
  }

  private async disconnectInternal(): Promise<void> {
    console.log("[Discord Gateway DO] Disconnecting from Discord Gateway");

    this.state.isConnected = false;
    this.clearHeartbeat();

    if (this.webSocket) {
      this.webSocket.close(1000, "Manual disconnect");
    }

    // Clear session state
    this.state.sessionId = undefined;
    this.state.sequenceNumber = undefined;
    this.state.resumeGatewayUrl = undefined;
    this.state.connectionAttempts = 0;

    await this.persistState();
  }

  private async persistState(): Promise<void> {
    await this.ctx.storage.put("state", this.state);
  }

  private async loadState(): Promise<void> {
    const stored = await this.ctx.storage.get<DiscordGatewayState>("state");
    if (stored) {
      this.state = { ...this.state, ...stored };
    }
  }

  private async getGatewayUrl(botToken: string): Promise<string> {
    try {
      console.log("[Discord Gateway DO] Fetching Gateway URL from Discord API...");

      const response = await fetch("https://discord.com/api/v10/gateway/bot", {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Discord Gateway DO] Discord API Error: ${response.status} ${response.statusText}`,
          errorText,
        );
        throw new Error(
          `Failed to get Gateway URL: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = (await response.json()) as DiscordGatewayBotResponse;

      // Cache the Gateway URL and shard info
      this.state.gatewayUrl = data.url;
      this.state.shards = data.shards;
      await this.persistState();

      // Construct the full Gateway URL with version and encoding
      const fullGatewayUrl = `${data.url}?v=10&encoding=json`;

      console.log(
        `[Discord Gateway DO] Got Gateway URL: ${fullGatewayUrl}, Shards: ${data.shards}`,
      );
      console.log(
        `[Discord Gateway DO] Session start limit: ${data.session_start_limit.remaining}/${data.session_start_limit.total}`,
      );

      return fullGatewayUrl;
    } catch (error) {
      console.error("[Discord Gateway DO] Failed to get Gateway URL:", error);
      // Fallback to default Gateway URL
      const fallbackUrl = "wss://gateway.discord.gg/?v=10&encoding=json";
      console.log(`[Discord Gateway DO] Using fallback Gateway URL: ${fallbackUrl}`);
      return fallbackUrl;
    }
  }

  // RPC Methods for external calls
  async startGateway(integrationId: string): Promise<{ success: boolean; message: string }> {
    try {
      this.state.integrationId = integrationId;

      // Get Discord integration details
      const db = createDb(this.env);
      const integration = await db.query.discordIntegration.findFirst({
        where: eq(schema.discordIntegration.id, integrationId),
      });

      if (!integration) {
        return { success: false, message: "Discord integration not found" };
      }

      if (this.state.isConnected) {
        return { success: true, message: "Gateway already started" };
      }

      // Log bot token info for debugging (safely)
      const tokenStart = integration.botAccessToken?.slice(0, 10) || "undefined";
      console.log(`[Discord Gateway DO] Starting gateway with token: ${tokenStart}...`);

      await this.connectToGateway(integration.botAccessToken);
      await this.persistState();
      return { success: true, message: "Discord Gateway started successfully" };
    } catch (error) {
      console.error("[Discord Gateway DO] Connection failed:", error);
      return {
        success: false,
        message: `Failed to start gateway: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async stopGateway(): Promise<{ success: boolean; message: string }> {
    try {
      await this.disconnectInternal();
      return { success: true, message: "Discord Gateway stopped successfully" };
    } catch (error) {
      console.error("[Discord Gateway DO] Disconnect failed:", error);
      return {
        success: false,
        message: `Failed to stop gateway: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async getStatus(): Promise<{
    isConnected: boolean;
    sessionId?: string;
    sequenceNumber?: number;
    connectionAttempts: number;
    lastHeartbeat?: number;
  }> {
    return {
      isConnected: this.state.isConnected,
      sessionId: this.state.sessionId,
      sequenceNumber: this.state.sequenceNumber,
      connectionAttempts: this.state.connectionAttempts,
      lastHeartbeat: this.state.lastHeartbeat,
    };
  }

  // Called when the Durable Object is first created
  async alarm(): Promise<void> {
    // Load state from storage
    await this.loadState();

    // Auto-reconnect if we have a valid integration and were previously connected
    if (this.state.integrationId && this.state.sessionId) {
      const db = createDb(this.env);
      const integration = await db.query.discordIntegration.findFirst({
        where: eq(schema.discordIntegration.id, this.state.integrationId),
      });

      if (integration) {
        console.log("[Discord Gateway DO] Auto-reconnecting after restart");
        try {
          await this.connectToGateway(integration.botAccessToken);
        } catch (error) {
          console.error("[Discord Gateway DO] Auto-reconnect failed:", error);
        }
      }
    }
  }
}
