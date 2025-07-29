export function postProcess(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // Extract status indicators - handle optional leading dash and spaces
      const statusMatch = line.match(/^-?\s*\(blocker=(true|false),in-progress=(true|false)\)\s*/);

      if (statusMatch) {
        const isBlocker = statusMatch[1] === "true";
        const isInProgress = statusMatch[2] === "true";
        const content = line
          .replace(statusMatch[0], "") // Remove entire matched portion including dash and status
          .replace(/\.+$/, "") // Remove trailing dots
          .trim();

        return {
          content,
          isBlocker,
          isInProgress,
        };
      }

      // Fallback for lines without proper status format
      const content = line.replace(/^-\s*/, "").replace(/\.+$/, "").trim();

      return {
        content,
        isBlocker: false,
        isInProgress: false,
      };
    });
}
