export interface LinearActivitySummaryResult {
  generalSummary: string | null;
  teamSummaries: Array<{ content: string }>;
  projectSummaries: Array<{ content: string }>;
}

export function postProcess(text: string): LinearActivitySummaryResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let generalSummary: string | null = null;
  const teamSummaries: Array<{ content: string }> = [];
  const projectSummaries: Array<{ content: string }> = [];

  for (const line of lines) {
    const generalMatch = line.match(/^-?\s*\(general\)\s*(.+)$/);
    if (generalMatch) {
      const content = generalMatch[1]?.trim();
      if (content) generalSummary = content;
      continue;
    }

    const teamMatch = line.match(/^-?\s*\(team\)\s*(.+)$/);
    if (teamMatch) {
      const content = teamMatch[1]?.trim();
      if (content) teamSummaries.push({ content });
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
      if (content.length > 0) teamSummaries.push({ content });
    }
  }

  return { generalSummary, teamSummaries, projectSummaries };
}
