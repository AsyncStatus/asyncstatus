import type { InstallationStore } from "@slack/bolt";
import { generateId } from "better-auth";
import * as schema from "../db";
import type { Db } from "../db/db";

export function createSlackAppInstallationStore(db: Db): InstallationStore {
  return {
    storeInstallation: async (installation) => {
      if (installation.team !== undefined) {
        await db.insert(schema.slackIntegration).values({
          id: generateId(),
          botAccessToken: installation.bot?.token!,
          botToken: installation.bot?.token,
          botScopes: installation.bot?.scopes,
          userScopes: installation.user?.scopes,
          enterpriseName: installation.enterprise?.name,
          enterpriseId: installation.enterprise?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return;
      }
      throw new Error("Failed to save installation data to installationStore");
    },
    fetchInstallation: async (installQuery) => {
      if (installQuery.teamId !== undefined) {
        // TODO: Fetch installation from database
        return;
      }
      throw new Error("Failed to fetch installation");
    },
    deleteInstallation: async (installQuery) => {
      if (installQuery.teamId !== undefined) {
        // TODO: Delete installation from database
        return;
      }
      throw new Error("Failed to delete installation");
    },
  };
}

const userScopes = [
  "channels:history",
  "channels:read",
  "dnd:read",
  "emoji:read",
  "files:read",
  "groups:history",
  "groups:read",
  "im:history",
  "im:read",
  "mpim:history",
  "mpim:read",
  "pins:read",
  "reactions:read",
  "team:read",
  "users:read",
  "users.profile:read",
  "users:read.email",
  "calls:read",
  "reminders:read",
  "reminders:write",
  "stars:read",
];

const botScopes = [
  "app_mentions:read",
  "channels:history",
  "channels:join",
  "channels:read",
  "chat:write",
  "chat:write.public",
  "commands",
  "emoji:read",
  "files:read",
  "groups:history",
  "groups:read",
  "im:history",
  "im:read",
  "incoming-webhook",
  "mpim:history",
  "mpim:read",
  "pins:read",
  "reactions:read",
  "team:read",
  "users:read",
  "users.profile:read",
  "users:read.email",
  "calls:read",
  "reminders:read",
  "reminders:write",
  "channels:manage",
  "chat:write.customize",
  "im:write",
  "links:read",
  "metadata.message:read",
  "mpim:write",
  "pins:write",
  "reactions:write",
  "dnd:read",
  "usergroups:read",
  "usergroups:write",
  "users:write",
  "remote_files:read",
  "remote_files:write",
  "files:write",
  "groups:write",
];
