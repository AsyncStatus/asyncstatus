import { eq } from "drizzle-orm";
import type { Db } from "../../db";
import * as schema from "../../db/schema";
import {
  createSlackClient,
  formatStatusMessage,
  postSlackMessage,
  type SlackConfig,
  type StatusUpdatePayload,
} from "../../lib/slack";

export interface ProcessStatusUpdateParams {
  statusUpdate: StatusUpdatePayload;
  slackConfig: SlackConfig;
  organizationId: string;
}

export interface ProcessStatusUpdateResult {
  success: boolean;
  statusUpdateId?: string | null;
  slackMessageTs?: string;
  error?: string;
}

// Main workflow function that processes a Slack status update
export async function processStatusUpdate(
  params: ProcessStatusUpdateParams,
  db: Db
): Promise<ProcessStatusUpdateResult> {
  const { statusUpdate, slackConfig, organizationId } = params;

  console.log("Processing Slack status update:", statusUpdate);

  try {
    // Step 1: Validate the status update
    if (!statusUpdate.userId || !statusUpdate.status) {
      throw new Error("Invalid status update payload");
    }

    // Step 2: Find the member in the database
    const member = await findMemberBySlackId(db, statusUpdate.userId);

    // Step 3: Create or update status in database
    const statusUpdateId = await saveStatusUpdate(
      db,
      member,
      statusUpdate,
      organizationId
    );

    // Step 4: Post message to Slack
    const slackResult = await postStatusToSlack(slackConfig, statusUpdate);

    if (!slackResult.ok) {
      console.error("Failed to post Slack message:", slackResult.error);
      return {
        success: false,
        error: slackResult.error,
        statusUpdateId,
      };
    }

    console.log("Successfully processed status update");
    return {
      success: true,
      statusUpdateId,
      slackMessageTs: slackResult.ts,
    };
  } catch (error) {
    console.error("Error processing status update:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to find member by Slack ID
async function findMemberBySlackId(
  db: Db,
  slackUserId: string
): Promise<(typeof schema.member.$inferSelect) | null> {
  try {
    // Try to find member by Slack user ID first
    const memberBySlack = await db
      .select()
      .from(schema.member)
      .where(eq(schema.member.slackUsername, slackUserId))
      .limit(1);

    // Explicitly check for length and return the first item or null
    const firstMember = memberBySlack[0];
    return firstMember ? firstMember : null;
  } catch (error) {
    console.error("Error finding member by Slack ID:", error);
    return null;
  }
}

// Helper function to save status update to database
async function saveStatusUpdate(
  db: Db,
  member: (typeof schema.member.$inferSelect) | null,
  statusUpdate: StatusUpdatePayload,
  organizationId: string
): Promise<string | null> {
  try {
    if (!member || member === null) {
      console.warn("Member not found for Slack user:", statusUpdate.userId);
      // We can still post to Slack even if we don't have a member record
      return null;
    }

    // Create a new status update
    const statusUpdateData = {
      id: crypto.randomUUID(),
      memberId: member.id,
      organizationId: organizationId,
      editorJson: null,
      teamId: null,
      effectiveFrom: new Date(),
      effectiveTo: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      mood: null,
      emoji: null,
      notes: statusUpdate.status,
      isDraft: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.statusUpdate).values(statusUpdateData);

    return statusUpdateData.id;
  } catch (error) {
    console.error("Error saving status update:", error);
    return null;
  }
}

// Helper function to post status to Slack
async function postStatusToSlack(
  slackConfig: SlackConfig,
  statusUpdate: StatusUpdatePayload
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  try {
    const client = createSlackClient(slackConfig);
    const message = formatStatusMessage(statusUpdate);

    return await postSlackMessage(client, statusUpdate.channelId, message);
  } catch (error) {
    console.error("Error posting to Slack:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Workflow entrypoint for Cloudflare Workers (when available)
export class ProcessStatusUpdateWorkflow {
  static async run(
    params: ProcessStatusUpdateParams,
    env: any
  ): Promise<ProcessStatusUpdateResult> {
    // This would be implemented when Cloudflare Workers types are available
    // For now, we'll use the direct function approach
    const db = env.db || (await import("../../db").then(m => m.createDb(env)));
    return processStatusUpdate(params, db);
  }
}