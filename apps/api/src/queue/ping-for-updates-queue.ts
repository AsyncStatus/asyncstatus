import type { Bindings } from "../lib/env";

export type PingForUpdatesQueueMessage = {};

export async function pingForUpdatesQueue(
  batch: MessageBatch<PingForUpdatesQueueMessage>,
  env: Bindings,
  ctx: ExecutionContext,
) {}
