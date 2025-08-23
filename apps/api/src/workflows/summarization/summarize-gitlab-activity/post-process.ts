export interface GitlabActivitySummaryResult {
  generalSummary: string | null;
  projectSummaries: Array<{ content: string }>;
}

export function postProcess(text: string): GitlabActivitySummaryResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let generalSummary: string | null = null;
  const projectSummaries: Array<{ content: string }> = [];

  for (const line of lines) {
    const generalMatch = line.match(/^-?\s*\(general\)\s*(.+)$/);
    if (generalMatch) {
      const content = generalMatch[1]?.trim();
      if (content) generalSummary = content;
      continue;
    }

    const projectMatch = line.match(/^-?\s*\(project\)\s*(.+)$/);
    if (projectMatch) {
      const content = projectMatch[1]?.trim();
      if (content) projectSummaries.push({ content });
      continue;
    }

    if (line.startsWith("-") && !line.includes("(general)")) {
      const content = line.replace(/^-\s*/, "").trim();
      if (content.length > 0) projectSummaries.push({ content });
    }
  }

  return { generalSummary, projectSummaries };
}
