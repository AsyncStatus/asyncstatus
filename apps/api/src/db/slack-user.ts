import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { slackIntegration } from "./slack-integration";

export const slackUser = sqliteTable(
  "slack_user",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => slackIntegration.id, { onDelete: "cascade" }),
    slackUserId: text("slack_user_id").notNull().unique(), // User's Slack ID (U1234...)
    username: text("username"), // @username
    displayName: text("display_name"), // Display name
    email: text("email"),
    avatarUrl: text("avatar_url"),
    accessToken: text("access_token"), // User token (xoxp-) if user scopes granted
    scopes: text("scopes"), // Comma-separated user scopes
    isBot: integer("is_bot", { mode: "boolean" }).default(false),
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    refreshToken: text("refresh_token"),
    isInstaller: integer("is_installer", { mode: "boolean" }).default(false), // True for the user who installed the app
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("slack_user_integration_id_index").on(t.integrationId),
    index("slack_user_slack_user_id_index").on(t.slackUserId),
  ],
);

export const SlackUser = createSelectSchema(slackUser, {
  slackUserId: z.string().trim().min(1),
});
export type SlackUser = z.output<typeof SlackUser>;
export const SlackUserInsert = createInsertSchema(slackUser, {
  slackUserId: z.string().trim().min(1),
});
export type SlackUserInsert = z.output<typeof SlackUserInsert>;
export const SlackUserUpdate = createUpdateSchema(slackUser, {
  slackUserId: z.string().trim().min(1),
});
export type SlackUserUpdate = z.output<typeof SlackUserUpdate>;
