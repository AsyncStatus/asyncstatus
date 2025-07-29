import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { Db } from "../../../db/db";
import { getOrganizationStatusUpdatesTool } from "../tools/get-organization-status-updates-tool";
import { postProcess, type SummaryResult } from "./post-process";
import { systemPrompt } from "./system-prompt";

export type SummarizeStatusUpdatesOptions = {
  openRouterProvider: OpenRouterProvider;
  db: Db;
  organizationId: string;
  effectiveFrom: string;
  effectiveTo: string;
};

export async function summarizeStatusUpdates({
  openRouterProvider,
  db,
  organizationId,
  effectiveFrom,
  effectiveTo,
}: SummarizeStatusUpdatesOptions): Promise<SummaryResult> {
  const { text } = await generateText({
    model: openRouterProvider("google/gemini-2.5-flash"),
    seed: 123,
    maxSteps: 30,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Create a team status summary for the organization (organizationId: ${organizationId}) between the effectiveFrom and effectiveTo dates.
The effectiveFrom date is ${effectiveFrom} and the effectiveTo date is ${effectiveTo}.

Please analyze all team member status updates and create both a general team summary and individual user summaries following the specified format.`,
      },
    ],
    toolChoice: "auto",
    tools: {
      getOrganizationStatusUpdates: getOrganizationStatusUpdatesTool(db),
    },
  });

  return postProcess(text);
}
