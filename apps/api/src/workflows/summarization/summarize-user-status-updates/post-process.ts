export interface UserSummaryResult {
  generalSummary: string | null;
  items: Array<{ content: string }>;
}

export function postProcess(text: string): UserSummaryResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let generalSummary: string | null = null;
  const items: Array<{ content: string }> = [];

  for (const line of lines) {
    const generalMatch = line.match(/^-?\s*\(general\)\s*(.+)$/);
    if (generalMatch) {
      const content = generalMatch[1]?.trim();
      if (content) generalSummary = content;
      continue;
    }

    const itemMatch = line.match(/^-?\s*\(item\)\s*(.+)$/);
    if (itemMatch) {
      const content = itemMatch[1]?.trim();
      if (content) items.push({ content });
      continue;
    }

    if (line.startsWith("-") && !line.includes("(general)")) {
      const content = line.replace(/^-\s*/, "").trim();
      if (content.length > 0) items.push({ content });
    }
  }

  return { generalSummary, items };
}
