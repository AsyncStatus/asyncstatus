import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { teamsIntegration } from "./teams-integration";

export const teamsChannel = sqliteTable(
  "teams_channel",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => teamsIntegration.id, { onDelete: "cascade" }),
    channelId: text("channel_id").notNull().unique(), // Microsoft Teams channel ID
    teamId: text("team_id").notNull(), // Parent team ID
    displayName: text("display_name").notNull(),
    description: text("description"),
    email: text("email"), // Channel email address
    webUrl: text("web_url"), // Web URL for the channel
    membershipType: text("membership_type"), // standard, private, shared, unknownFutureValue
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    isFavoriteByDefault: integer("is_favorite_by_default", { mode: "boolean" }).notNull().default(false),
    createdDateTime: integer("created_date_time", { mode: "timestamp" }),
    tenantId: text("tenant_id"), // Azure AD tenant ID
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("teams_channel_integration_id_index").on(t.integrationId),
    index("teams_channel_channel_id_index").on(t.channelId),
    index("teams_channel_team_id_index").on(t.teamId),
  ],
);

export const TeamsChannel = createSelectSchema(teamsChannel);
export type TeamsChannel = z.output<typeof TeamsChannel>;
export const TeamsChannelInsert = createInsertSchema(teamsChannel);
export type TeamsChannelInsert = z.output<typeof TeamsChannelInsert>;
export const TeamsChannelUpdate = createUpdateSchema(teamsChannel);
export type TeamsChannelUpdate = z.output<typeof TeamsChannelUpdate>;