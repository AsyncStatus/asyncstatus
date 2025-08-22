import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { teamsChannel } from "./teams-channel";
import { teamsIntegration } from "./teams-integration";
import { teamsUser } from "./teams-user";

export const teamsEvent = sqliteTable(
  "teams_event",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => teamsIntegration.id, { onDelete: "cascade" }),
    eventId: text("event_id").notNull().unique(), // Teams message/event ID
    eventType: text("event_type").notNull(), // message, reply, reaction, meeting, call, etc.
    eventSubtype: text("event_subtype"), // text, card, file, etc.
    channelId: text("channel_id").references(() => teamsChannel.id, { onDelete: "set null" }),
    teamId: text("team_id"), // Parent team ID
    chatId: text("chat_id"), // For 1:1 or group chats
    userId: text("user_id").references(() => teamsUser.id, { onDelete: "set null" }),
    fromUserId: text("from_user_id"), // Message sender
    memberId: text("member_id").references(() => member.id, { onDelete: "set null" }),
    parentEventId: text("parent_event_id"), // For replies/threads
    replyToId: text("reply_to_id"), // Direct reply reference
    body: text("body"), // Message content (plain text)
    bodyHtml: text("body_html"), // HTML content
    summary: text("summary"), // AI-generated summary
    attachments: text("attachments"), // JSON string of attachments
    mentions: text("mentions"), // JSON string of @mentions
    reactions: text("reactions"), // JSON string of reactions
    importance: text("importance"), // normal, high, urgent
    subject: text("subject"), // Message subject
    webUrl: text("web_url"), // Web URL for the message
    etag: text("etag"), // For change tracking
    isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
    isEdited: integer("is_edited", { mode: "boolean" }).notNull().default(false),
    deletedDateTime: integer("deleted_date_time", { mode: "timestamp" }),
    lastModifiedDateTime: integer("last_modified_date_time", { mode: "timestamp" }),
    createdDateTime: integer("created_date_time", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("teams_event_integration_id_index").on(t.integrationId),
    index("teams_event_event_id_index").on(t.eventId),
    index("teams_event_channel_id_index").on(t.channelId),
    index("teams_event_user_id_index").on(t.userId),
    index("teams_event_member_id_index").on(t.memberId),
    index("teams_event_created_date_time_index").on(t.createdDateTime),
    index("teams_event_type_index").on(t.eventType),
  ],
);

export const TeamsEvent = createSelectSchema(teamsEvent);
export type TeamsEvent = z.output<typeof TeamsEvent>;
export const TeamsEventInsert = createInsertSchema(teamsEvent);
export type TeamsEventInsert = z.output<typeof TeamsEventInsert>;
export const TeamsEventUpdate = createUpdateSchema(teamsEvent);
export type TeamsEventUpdate = z.output<typeof TeamsEventUpdate>;