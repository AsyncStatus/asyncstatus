import { z } from "zod";

export const zSlackIntegrationCreate = z.object({
  organizationId: z.string().min(1),
});

export const zSlackIntegrationUpdate = z.object({
  settings: z.record(z.unknown()).optional(),
});

export const zSlackCommandSchema = z.object({
  command: z.string(),
  text: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  channel_id: z.string(),
  team_id: z.string(),
  response_url: z.string().url(),
  trigger_id: z.string(),
});

export const zSlackEventSchema = z.object({
  type: z.string(),
  event: z.record(z.unknown()),
  team_id: z.string(),
  event_id: z.string(),
  event_time: z.number(),
});

export const zSlackChallengeSchema = z.object({
  type: z.literal('url_verification'),
  challenge: z.string(),
});
