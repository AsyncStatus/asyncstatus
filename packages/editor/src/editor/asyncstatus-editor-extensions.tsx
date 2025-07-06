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

import { BlockableTodoListItem } from "../extensions/blockable-todo-item";
import { BlockableTodoList } from "../extensions/blockable-todo-list";
import { CustomKeymap } from "../extensions/custom-keymap";
import { MoodHeading } from "../extensions/mood-heading";
import { NotesHeading } from "../extensions/notes-heading";
import { StatusUpdateHeading } from "../extensions/status-update-heading";
import { TaskItemCount } from "../extensions/task-item-count";

const placeholder = Placeholder.configure({
  placeholder: ({ node, editor }): string => {
    if (node.type.name === "heading") {
      return `Heading ${node.attrs.level}`;
    }

    // Check if we're in a blockable todo item within status update section
    if (node.type.name === "paragraph") {
      const { state } = editor;

      // Find positions of status update heading, notes heading, and mood heading
      let statusUpdatePos = -1;
      let notesHeadingPos = -1;
      let moodHeadingPos = -1;

      state.doc.descendants((docNode, pos) => {
        if (docNode.type.name === "statusUpdateHeading") {
          statusUpdatePos = pos;
        } else if (docNode.type.name === "notesHeading") {
          notesHeadingPos = pos;
        } else if (docNode.type.name === "moodHeading") {
          moodHeadingPos = pos;
        }
      });

      // Find current node position in the document
      let currentNodePos = -1;
      state.doc.descendants((docNode, pos) => {
        if (docNode === node) {
          currentNodePos = pos;
          return false;
        }
      });

      // Check if we're in status update section
      const isInStatusUpdateSection =
        statusUpdatePos !== -1 &&
        notesHeadingPos !== -1 &&
        currentNodePos > statusUpdatePos &&
        currentNodePos < notesHeadingPos;

      if (isInStatusUpdateSection) {
        let isInBlockableTodo = false;

        // Find all blockable todo nodes in status update section
        const blockableTodoNodes: (typeof node)[] = [];
        state.doc.descendants((docNode, pos) => {
          if (pos > statusUpdatePos && pos < notesHeadingPos) {
            if (docNode.type.name === "blockableTodoListItem") {
              docNode.descendants((child) => {
                if (child.type.name === "paragraph") {
                  blockableTodoNodes.push(child);
                }
              });
            }
          }
        });

        // Check if current node is in blockable todo and if it's the first one
        state.doc.descendants((docNode, pos) => {
          if (pos > statusUpdatePos && pos < notesHeadingPos) {
            if (docNode.type.name === "blockableTodoListItem") {
              // Check if our node is a descendant of this todo item
              let found = false;
              docNode.descendants((child) => {
                if (child === node) {
                  found = true;
                  return false;
                }
              });

              if (found) {
                isInBlockableTodo = true;
                return false; // Stop iteration
              }
            }
          }
        });

        if (isInBlockableTodo) {
          return "What did you do? What are you planning to work on?";
        }
      }

      // Check if we're in notes section (between notes heading and mood heading)
      const isInNotesSection =
        notesHeadingPos !== -1 &&
        moodHeadingPos !== -1 &&
        currentNodePos > notesHeadingPos &&
        currentNodePos < moodHeadingPos;

      if (isInNotesSection) {
        // Find all paragraph nodes in notes section
        const notesNodes: (typeof node)[] = [];
        state.doc.descendants((docNode, pos) => {
          if (pos > notesHeadingPos && pos < moodHeadingPos && docNode.type.name === "paragraph") {
            notesNodes.push(docNode);
          }
        });

        // Check if this is the first paragraph node in notes section
        const isFirstNotesNode = notesNodes[0] === node;

        if (isFirstNotesNode) {
          return "Any notes, insights, comments";
        }
      }

      // Check if we're in mood section (after mood heading)
      const isInMoodSection = moodHeadingPos !== -1 && currentNodePos > moodHeadingPos;

      if (isInMoodSection) {
        // Find all paragraph nodes in mood section
        const moodNodes: (typeof node)[] = [];
        state.doc.descendants((docNode, pos) => {
          if (pos > moodHeadingPos && docNode.type.name === "paragraph") {
            moodNodes.push(docNode);
          }
        });

        // Check if this is the first paragraph node in mood section
        const isFirstMoodNode = moodNodes[0] === node;

        if (isFirstMoodNode) {
          return "How are you feeling? What's your mood? Include an emoji if you want.";
        }
      }
    }

    return "";
  },
  includeChildren: true,
  showOnlyCurrent: false,
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
  customNodes: ["blockableTodoListItem"],
});

const statusUpdateHeading = StatusUpdateHeading.configure({});

const notesHeading = NotesHeading.configure({});

const moodHeading = MoodHeading.configure({});

const blockableTodoList = BlockableTodoList.configure({});

const blockableTodoItem = BlockableTodoListItem.configure({});

export const asyncStatusEditorExtensions = [
  statusUpdateHeading,
  notesHeading,
  moodHeading,
  starterKit,
  placeholder,
  link,
  taskList,
  taskItem,
  blockableTodoList,
  blockableTodoItem,
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
