import type { JSONContent } from "@tiptap/core";

export interface StatusUpdateItem {
  content: string;
  isBlocker: boolean;
  isInProgress: boolean;
  order: number;
}

export interface ExtractedStatusUpdateData {
  statusUpdateItems: StatusUpdateItem[];
  mood: string | null;
  moodEmoji: string | null;
  notes: string | null;
  date: string | null;
}

/**
 * Extracts text content from a node and its children
 */
function extractTextFromNode(node: JSONContent): string {
  // Handle text nodes with marks (like links, bold, italic)
  if (node.type === "text" && node.text) {
    let text = node.text;

    // Check if this text has any marks
    if (node.marks && Array.isArray(node.marks)) {
      // Process marks in reverse order to handle nested marks correctly
      for (const mark of node.marks.reverse()) {
        if (mark.type === "link" && mark.attrs?.href) {
          // Convert to markdown link format
          text = `[${text}](${mark.attrs.href})`;
        } else if (mark.type === "bold") {
          // Convert to markdown bold
          text = `**${text}**`;
        } else if (mark.type === "italic") {
          // Convert to markdown italic
          text = `*${text}*`;
        } else if (mark.type === "code") {
          // Convert to markdown inline code
          text = `\`${text}\``;
        } else if (mark.type === "strike") {
          // Convert to markdown strikethrough
          text = `~~${text}~~`;
        }
      }
    }

    return text;
  }

  if (node.content && Array.isArray(node.content)) {
    // Add spacing between block elements
    const texts = node.content.map((child) => extractTextFromNode(child));

    // Handle different node types
    if (node.type === "listItem") {
      // Add bullet point for list items
      return "• " + texts.join("") + "\n";
    } else if (node.type === "paragraph") {
      return texts.join("") + "\n";
    } else if (node.type === "heading") {
      const level = node.attrs?.level || 1;
      return "#".repeat(level) + " " + texts.join("") + "\n";
    } else if (node.type === "codeBlock") {
      return "```\n" + texts.join("") + "\n```\n";
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      return texts.join("");
    }

    return texts.join("");
  }

  // Handle hard breaks
  if (node.type === "hardBreak") {
    return "\n";
  }

  return "";
}

/**
 * Extracts emoji from text content (assumes emoji is at the beginning)
 */
function extractEmojiFromText(text: string): {
  emoji: string | null;
  remainingText: string;
} {
  // More comprehensive emoji regex that handles:
  // - Basic emojis
  // - Compound emojis with ZWJ (Zero Width Joiner)
  // - Emojis with skin tone modifiers
  // - Flag emojis
  // - Keycap emojis
  const emojiRegex =
    /^((?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F?))*)\s*/u;
  const match = text.match(emojiRegex);

  if (match && match[1]) {
    return {
      emoji: match[1],
      remainingText: text.slice(match[0].length).trim(),
    };
  }

  return {
    emoji: null,
    remainingText: text.trim(),
  };
}

/**
 * Extracts status update data from TipTap JSONContent
 *
 * @example
 * const editor = useCurrentEditor();
 * const json = editor.getJSON();
 * const data = extractStatusUpdateData(json);
 * console.log(data.statusUpdateItems); // Array of status items
 * console.log(data.date); // Date from status update heading
 * console.log(data.mood); // Mood text
 * console.log(data.moodEmoji); // Emoji from mood section
 * console.log(data.notes); // Notes content
 */
export function extractStatusUpdateData(content: JSONContent): ExtractedStatusUpdateData {
  const result: ExtractedStatusUpdateData = {
    statusUpdateItems: [],
    mood: null,
    moodEmoji: null,
    notes: null,
    date: null,
  };

  if (!content.content || !Array.isArray(content.content)) {
    return result;
  }

  let currentSection: "none" | "notes" | "mood" = "none";
  let itemOrder = 0;
  const notesContent: string[] = [];
  const moodContent: string[] = [];

  for (let i = 0; i < content.content.length; i++) {
    const node = content.content[i];
    if (!node) continue;

    // Extract date from status update heading
    if (node.type === "statusUpdateHeading") {
      if (node.attrs?.date) {
        result.date = node.attrs.date;
      }
      currentSection = "none";
    }

    // Extract status update items from blockable todo list
    if (node.type === "blockableTodoList" && node.content) {
      for (const listItem of node.content) {
        if (listItem.type === "blockableTodoListItem") {
          const textContent = extractTextFromNode(listItem);
          if (textContent.trim()) {
            result.statusUpdateItems.push({
              content: textContent.trim(),
              isBlocker: listItem.attrs?.blocked === true,
              isInProgress: listItem.attrs?.checked === false,
              order: itemOrder++,
            });
          }
        }
      }
      currentSection = "none";
    }

    // Track when we hit the notes heading
    if (node.type === "notesHeading") {
      currentSection = "notes";
      continue; // Skip the heading itself
    }

    // Track when we hit the mood heading
    if (node.type === "moodHeading") {
      currentSection = "mood";
      continue; // Skip the heading itself
    }

    // Collect content based on current section
    // Skip only specific heading types and blockable todo lists
    const skipTypes = ["statusUpdateHeading", "notesHeading", "moodHeading", "blockableTodoList"];
    const shouldSkip = skipTypes.includes(node.type || "");

    if (currentSection === "notes" && !shouldSkip) {
      const text = extractTextFromNode(node);
      if (text.trim()) {
        notesContent.push(text.trim());
      }
    }

    if (currentSection === "mood" && !shouldSkip) {
      const text = extractTextFromNode(node);
      if (text.trim()) {
        moodContent.push(text.trim());
      }
    }
  }

  // Process collected notes
  if (notesContent.length > 0) {
    result.notes = notesContent.join("\n");
  }

  // Process collected mood content
  if (moodContent.length > 0) {
    const fullMoodText = moodContent.join("\n");
    const { emoji, remainingText } = extractEmojiFromText(fullMoodText);
    result.moodEmoji = emoji;
    result.mood = remainingText || null;
  }

  return result;
}

/**
 * Converts extracted status update data to API format
 */
export function toApiFormat(data: ExtractedStatusUpdateData) {
  return {
    emoji: data.moodEmoji,
    mood: data.mood,
    notes: data.notes,
    date: data.date ? new Date(data.date) : new Date(),
    items: data.statusUpdateItems,
  };
}
