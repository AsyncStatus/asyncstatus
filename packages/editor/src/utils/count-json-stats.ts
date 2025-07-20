import type { JSONContent } from "@tiptap/core";

export interface JSONDocStats {
  inProgressTaskItems: number;
  doneTaskItems: number;
  blockedTaskItems: number;
  words: number;
}

/**
 * Traverse a TipTap JSON document once and return both task item and word counts.
 * This is more efficient than running the two independent counters.
 */
export const countJSONStats = (doc: JSONContent | null | undefined): JSONDocStats => {
  const result: JSONDocStats = {
    inProgressTaskItems: 0,
    doneTaskItems: 0,
    blockedTaskItems: 0,
    words: 0,
  };

  if (!doc) {
    return result;
  }

  const traverse = (node: JSONContent) => {
    if (!node) return;

    if (node.type === "blockableTodoListItem") {
      if (!node.attrs?.checked) {
        result.inProgressTaskItems += 1;
      }
      if (node.attrs?.checked) {
        result.doneTaskItems += 1;
      }
      if (node.attrs?.blocked) {
        result.blockedTaskItems += 1;
      }
    }

    if (typeof (node as any).text === "string") {
      const wordsInNode = (node as any).text
        .split(/\s+/u)
        .filter((word: string) => word.length > 0).length;
      result.words += wordsInNode;
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  };

  traverse(doc);

  return result;
};
