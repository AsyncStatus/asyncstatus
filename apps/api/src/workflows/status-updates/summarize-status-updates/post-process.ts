export interface SummaryResult {
  generalSummary: string | null;
  userSummaries: Array<{
    content: string;
  }>;
}

export function postProcess(text: string): SummaryResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let generalSummary: string | null = null;
  const userSummaries: Array<{ content: string }> = [];

  for (const line of lines) {
    // Extract general summary
    const generalMatch = line.match(/^-?\s*\(general\)\s*(.+)$/);
    if (generalMatch) {
      const content = generalMatch[1]?.trim();
      if (content) {
        generalSummary = content;
      }
      continue;
    }

    // Extract user summaries
    const userMatch = line.match(/^-?\s*\(user\)\s*(.+)$/);
    if (userMatch) {
      const content = userMatch[1]?.trim();
      if (content) {
        userSummaries.push({ content });
      }
      continue;
    }

    // Handle lines without proper prefixes (fallback)
    if (line.startsWith("-") && !line.includes("(general)") && !line.includes("(user)")) {
      // Treat as user summary if no general summary exists yet, otherwise as user summary
      const content = line.replace(/^-\s*/, "").trim();
      if (content.length > 0) {
        userSummaries.push({ content });
      }
    }
  }

  return {
    generalSummary,
    userSummaries,
  };
}
