import { cn } from "@asyncstatus/ui/lib/utils";
import { CharacterCount } from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { StarterKit } from "@tiptap/starter-kit";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";

import { CustomKeymap } from "../extensions/custom-keymap";
import { MoodHeading } from "../extensions/mood-heading";
import { NotesHeading } from "../extensions/notes-heading";
import { StatusUpdateHeading } from "../extensions/status-update-heading";
import { TaskItemCount } from "../extensions/task-item-count";

const placeholder = Placeholder.configure({
  placeholder: ({ node }) => {
    if (node.type.name === "heading") {
      return `Heading ${node.attrs.level}`;
    }
    return "Press '/' for commands";
  },
  includeChildren: true,
});

const HighlightExtension = Highlight.configure({
  multicolor: true,
});

const link = Link.configure({
  HTMLAttributes: {
    class: cn(
      "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
    ),
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cn("not-prose pl-2 "),
  },
});
const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cn("flex gap-2 items-start my-4"),
  },
  nested: true,
});

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cn("mt-4 mb-6 border-t border-muted-foreground"),
  },
});

const starterKit = StarterKit.configure({
  bulletList: {},
  orderedList: {},
  listItem: {},
  blockquote: {},
  codeBlock: {},
  code: { HTMLAttributes: { spellcheck: "false" } },
  horizontalRule: false,
  dropcursor: { color: "#DBEAFE", width: 4 },
  gapcursor: false,
});

const characterCount = CharacterCount.configure({
  textCounter: (text) => {
    return [...new Intl.Segmenter().segment(text)].length;
  },
  wordCounter: (text) => {
    return text.split(" ").filter((word) => word !== "").length;
  },
});

// Custom extension for counting task items
const taskItemCount = TaskItemCount.configure({});

const globalDragHandle = GlobalDragHandle.configure({
  excludedTags: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "hr", "blockquote"],
  customNodes: [],
});

const statusUpdateHeading = StatusUpdateHeading.configure({});

const notesHeading = NotesHeading.configure({});

const moodHeading = MoodHeading.configure({});

export const asyncStatusEditorExtensions = [
  statusUpdateHeading,
  notesHeading,
  moodHeading,
  starterKit,
  placeholder,
  link,
  taskList,
  taskItem,
  Underline,
  horizontalRule,
  characterCount,
  taskItemCount,
  HighlightExtension,
  TextStyle,
  Color,
  CustomKeymap,
  globalDragHandle,
];
