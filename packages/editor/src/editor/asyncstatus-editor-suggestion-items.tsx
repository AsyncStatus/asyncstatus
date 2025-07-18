import type { Editor } from "@tiptap/core";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Smile,
  Text,
  TextQuote,
} from "lucide-react";

import {
  Command,
  createSuggestionItems,
  renderItems,
  type SuggestionItem,
} from "../extensions/slash-command";

// Base suggestion items available everywhere
const baseSuggestionItems = createSuggestionItems([
  {
    title: "Emoji",
    description: "Insert an emoji.",
    searchTerms: ["emoji", "emoticon", "smiley", "face"],
    icon: <Smile size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Trigger emoji picker opening
      const event = new CustomEvent("openEmojiPicker", {
        detail: { editor, position: range.from },
      });
      document.dispatchEvent(event);
    },
  },
  {
    title: "Text",
    description: "Just start typing with plain text.",
    searchTerms: ["p", "paragraph"],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
    },
  },
  {
    title: "Heading 1",
    description: "Big section heading.",
    searchTerms: ["title", "big", "large"],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading.",
    searchTerms: ["subtitle", "medium"],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading.",
    searchTerms: ["subtitle", "small"],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list.",
    searchTerms: ["unordered", "point"],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering.",
    searchTerms: ["ordered"],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote.",
    searchTerms: ["blockquote"],
    icon: <TextQuote size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("blockquote", "paragraph").run();
    },
  },
]);

const textSuggestion: SuggestionItem = baseSuggestionItems.find(
  (i) => i.title === "Text",
) as SuggestionItem;

/**
 * Return context-aware suggestion items depending on where the caret is.
 *
 * If the cursor is between the Status Update and Notes sections, we only offer
 * the Todo item for quickly adding tasks. Otherwise, we show the full list.
 */
export const getSuggestionItems = (editor: Editor): SuggestionItem[] => {
  try {
    const { state } = editor;
    const pos = state.selection.$from.pos;

    let statusPos: number | null = null;
    let notesPos: number | null = null;
    let moodPos: number | null = null;

    state.doc.descendants((node: any, position: number) => {
      if (node.type.name === "statusUpdateHeading") {
        statusPos = position;
      }
      if (node.type.name === "notesHeading" && notesPos === null) {
        notesPos = position;
      }
      if (node.type.name === "moodHeading" && moodPos === null) {
        moodPos = position;
      }
    });

    // Between Status and Notes -> task items
    if (statusPos !== null && notesPos !== null && pos > statusPos && pos < notesPos) {
      return [];
    }

    // Between Notes and Mood -> notes section
    if (notesPos !== null && moodPos !== null && pos > notesPos && pos < moodPos) {
      return [textSuggestion];
    }
  } catch (_) {
    // Fallback to full list on any error
  }

  return baseSuggestionItems;
};

export const slashCommand = Command.configure({
  suggestion: {
    items: ({ editor }: { editor: Editor }) => getSuggestionItems(editor),
    render: renderItems,
  },
});
