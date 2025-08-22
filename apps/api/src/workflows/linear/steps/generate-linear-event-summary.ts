import type Anthropic from "@anthropic-ai/sdk";
import type { LinearEvent } from "../../../db";

type GenerateLinearEventSummaryParams = {
  event: LinearEvent;
  anthropicClient: Anthropic;
};

export async function generateLinearEventSummary({
  event,
  anthropicClient,
}: GenerateLinearEventSummaryParams): Promise<string | null> {
  try {
    const payload = event.payload as any;

    let prompt = `Summarize this Linear ${event.type} event:\n\n`;
    prompt += `Action: ${event.action}\n`;

    if (event.type === "Issue") {
      prompt += `Issue: ${payload.identifier} - ${payload.title}\n`;
      if (payload.description) {
        prompt += `Description: ${payload.description.substring(0, 500)}\n`;
      }
      if (payload.state?.name) {
        prompt += `State: ${payload.state.name}\n`;
      }
      if (payload.priority) {
        prompt += `Priority: ${payload.priorityLabel}\n`;
      }
      if (payload.assignee?.name) {
        prompt += `Assignee: ${payload.assignee.name}\n`;
      }
      if (payload.project?.name) {
        prompt += `Project: ${payload.project.name}\n`;
      }
      if (payload.team?.name) {
        prompt += `Team: ${payload.team.name}\n`;
      }
    } else if (event.type === "Comment") {
      prompt += `Comment on ${payload.issue?.identifier}: ${payload.body?.substring(0, 500)}\n`;
      if (payload.user?.name) {
        prompt += `By: ${payload.user.name}\n`;
      }
    } else if (event.type === "Project") {
      prompt += `Project: ${payload.name}\n`;
      if (payload.description) {
        prompt += `Description: ${payload.description.substring(0, 500)}\n`;
      }
      if (payload.state) {
        prompt += `State: ${payload.state}\n`;
      }
      if (payload.progress) {
        prompt += `Progress: ${Math.round(payload.progress * 100)}%\n`;
      }
    } else if (event.type === "IssueLabel") {
      prompt += `Label: ${payload.name}\n`;
      if (payload.description) {
        prompt += `Description: ${payload.description}\n`;
      }
      if (payload.color) {
        prompt += `Color: ${payload.color}\n`;
      }
    } else if (event.type === "Cycle") {
      prompt += `Cycle: ${payload.name}\n`;
      if (payload.description) {
        prompt += `Description: ${payload.description.substring(0, 500)}\n`;
      }
      if (payload.startsAt && payload.endsAt) {
        prompt += `Duration: ${payload.startsAt} to ${payload.endsAt}\n`;
      }
      if (payload.progress) {
        prompt += `Progress: ${Math.round(payload.progress * 100)}%\n`;
      }
    } else if (event.type === "User") {
      prompt += `User: ${payload.name} (${payload.email})\n`;
      if (payload.admin) {
        prompt += `Role: Admin\n`;
      }
    } else if (event.type === "Team") {
      prompt += `Team: ${payload.name} (${payload.key})\n`;
      if (payload.description) {
        prompt += `Description: ${payload.description.substring(0, 500)}\n`;
      }
    } else {
      prompt += `Data: ${JSON.stringify(payload).substring(0, 1000)}\n`;
    }

    prompt += `\nProvide a brief, clear summary (max 2 sentences) focusing on what changed and its business impact.`;

    const response = await anthropicClient.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text;
    }

    return null;
  } catch (error) {
    console.error("Error generating Linear event summary:", error);
    throw error;
  }
}