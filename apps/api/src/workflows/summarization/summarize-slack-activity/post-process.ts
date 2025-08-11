export interface SlackActivitySummaryResult {
  generalSummary: string | null;
  channelSummaries: Array<{ content: string }>;
}

export function postProcess(text: string): SlackActivitySummaryResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let generalSummary: string | null = null;
  const channelSummaries: Array<{ content: string }> = [];

  for (const line of lines) {
    const generalMatch = line.match(/^-?\s*\(general\)\s*(.+)$/);
    if (generalMatch) {
      const content = generalMatch[1]?.trim();
      if (content) generalSummary = content;
      continue;
    }

    const channelMatch = line.match(/^-?\s*\(channel\)\s*(.+)$/);
    if (channelMatch) {
      const content = channelMatch[1]?.trim();
      if (content) channelSummaries.push({ content });
      continue;
    }

    if (line.startsWith("-") && !line.includes("(general)")) {
      const content = line.replace(/^-\s*/, "").trim();
      if (content.length > 0) channelSummaries.push({ content });
    }
  }

  return { generalSummary, channelSummaries };
}
