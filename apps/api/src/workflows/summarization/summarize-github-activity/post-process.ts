export interface GithubActivitySummaryResult {
  generalSummary: string | null;
  repoSummaries: Array<{ content: string }>;
}

export function postProcess(text: string): GithubActivitySummaryResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let generalSummary: string | null = null;
  const repoSummaries: Array<{ content: string }> = [];

  for (const line of lines) {
    const generalMatch = line.match(/^-?\s*\(general\)\s*(.+)$/);
    if (generalMatch) {
      const content = generalMatch[1]?.trim();
      if (content) generalSummary = content;
      continue;
    }

    const repoMatch = line.match(/^-?\s*\(repo\)\s*(.+)$/);
    if (repoMatch) {
      const content = repoMatch[1]?.trim();
      if (content) repoSummaries.push({ content });
      continue;
    }

    if (line.startsWith("-") && !line.includes("(general)")) {
      const content = line.replace(/^-\s*/, "").trim();
      if (content.length > 0) repoSummaries.push({ content });
    }
  }

  return { generalSummary, repoSummaries };
}
