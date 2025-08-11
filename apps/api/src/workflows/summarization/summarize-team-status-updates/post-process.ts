export interface TeamSummaryResult {
  generalSummary: string | null;
  userSummaries: Array<{ content: string }>;
}

export function postProcess(text: string): TeamSummaryResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let generalSummary: string | null = null;
  const userSummaries: Array<{ content: string }> = [];

  for (const line of lines) {
    const generalMatch = line.match(/^-?\s*\(general\)\s*(.+)$/);
    if (generalMatch) {
      const content = generalMatch[1]?.trim();
      if (content) generalSummary = content;
      continue;
    }

    const userMatch = line.match(/^-?\s*\(user\)\s*(.+)$/);
    if (userMatch) {
      const content = userMatch[1]?.trim();
      if (content) userSummaries.push({ content });
      continue;
    }

    if (line.startsWith("-") && !line.includes("(general)")) {
      const content = line.replace(/^-\s*/, "").trim();
      if (content.length > 0) userSummaries.push({ content });
    }
  }

  return { generalSummary, userSummaries };
}
