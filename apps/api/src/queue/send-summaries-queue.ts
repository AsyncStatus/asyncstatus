import type { Bindings } from "../lib/env";

export type SendSummariesQueueMessage = {};

export async function sendSummariesQueue(
  batch: MessageBatch<SendSummariesQueueMessage>,
  env: Bindings,
  ctx: ExecutionContext,
) {}
