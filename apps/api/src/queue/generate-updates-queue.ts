import type { Bindings } from "../lib/env";

export type GenerateUpdatesQueueMessage = {
  type: "generate-updates";
};

export async function generateUpdatesQueue(
  batch: MessageBatch<GenerateUpdatesQueueMessage>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  console.log("Generating updates");
}
