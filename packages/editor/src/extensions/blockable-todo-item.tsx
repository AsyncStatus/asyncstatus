import { Button } from "@asyncstatus/ui/components/button";
import { Checkbox } from "@asyncstatus/ui/components/checkbox";
import { Ban, Check, CircleDashed, ClockAlert, Play, X } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { TextSelection } from "@tiptap/pm/state";
import type { NodeViewProps } from "@tiptap/react";
import {
  mergeAttributes,
  Node,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import React from "react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockableTodoListItem: {
      toggleBlockableTodoItem: () => ReturnType;
      addBlockableTodoItem: () => ReturnType;
    };
  }
}

export interface BlockableTodoListItemOptions {
  HTMLAttributes?: Record<string, any>;
}

const BlockableTodoItemComponent = ({ node, updateAttributes, view }: NodeViewProps) => {
  const { checked, blocked } = node.attrs;

  const toggleChecked = () => {
    updateAttributes({ checked: !checked });
  };

  const toggleBlocked = () => {
    updateAttributes({ blocked: !blocked });
  };

  return (
    <NodeViewWrapper
      className={cn(
        "blockable-todo-item group bg-accent border-border relative mb-2 flex flex-col overflow-hidden rounded-lg border",
      )}
    >
      <NodeViewContent
        className={cn(
          "not-prose p-3 outline-none",
          checked && "text-muted-foreground line-through",
          blocked && "text-destructive",
        )}
      />

      <div className="flex w-full items-center">
        <Button
          size="sm"
          variant="ghost"
          className="w-22 justify-start opacity-30 transition-opacity select-none group-hover:opacity-100"
          onClick={toggleBlocked}
          title={blocked ? "Unblock item" : "Block item"}
        >
          {blocked ? <Ban className="size-4" /> : <Play className="size-4" />}
          {blocked ? "Blocker" : "Clear"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-30 transition-opacity select-none group-hover:opacity-100"
          onClick={toggleChecked}
          title={checked ? "Uncheck item" : "Check item"}
        >
          {checked ? <Check className="size-4" /> : <CircleDashed className="size-4" />}
          {checked ? "Done" : "In progress"}
        </Button>
      </div>
    </NodeViewWrapper>
  );
};

export const BlockableTodoListItem = Node.create<BlockableTodoListItemOptions>({
  name: "blockableTodoListItem",

  group: "listItem",

  content: "paragraph block*",

  defining: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.getAttribute("data-checked") === "true",
        renderHTML: (attributes) => ({
          "data-checked": attributes.checked,
        }),
      },
      blocked: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.getAttribute("data-blocked") === "true",
        renderHTML: (attributes) => ({
          "data-blocked": attributes.blocked,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `li[data-type="${this.name}"]`,
        priority: 51,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes ?? {}, HTMLAttributes, {
        "data-type": this.name,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockableTodoItemComponent);
  },

  addCommands() {
    return {
      toggleBlockableTodoItem:
        () =>
        ({ tr, state }) => {
          const { selection } = state;
          const { $from } = selection;
          const node = $from.parent;

          if (node.type.name === this.name) {
            tr.setNodeMarkup($from.before(), undefined, {
              ...node.attrs,
              checked: !node.attrs.checked,
            });
            return true;
          }

          return false;
        },
      addBlockableTodoItem:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;

          // Find the current position and create a new blockable todo item
          const listItemType = state.schema.nodes.blockableTodoListItem;
          const paragraphType = state.schema.nodes.paragraph;

          if (!listItemType || !paragraphType) return false;

          // Create a new blockable todo item with a paragraph
          const newItem = listItemType.create(
            { checked: false, blocked: false },
            paragraphType.create(),
          );

          // Insert after the current node
          const insertPos = $from.after();

          if (dispatch) {
            tr.insert(insertPos, newItem);
            tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 1)));
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Find positions of status update heading and notes heading
        let statusUpdatePos = -1;
        let notesHeadingPos = -1;

        state.doc.descendants((node, pos) => {
          if (node.type.name === "statusUpdateHeading") {
            statusUpdatePos = pos;
          } else if (node.type.name === "notesHeading") {
            notesHeadingPos = pos;
          }
        });

        // Check if we're between status update heading and notes heading
        const currentPos = $from.pos;
        const isInStatusUpdateSection =
          statusUpdatePos !== -1 &&
          notesHeadingPos !== -1 &&
          currentPos > statusUpdatePos &&
          currentPos < notesHeadingPos;

        // Only create blockable todo items within the status update section
        if (isInStatusUpdateSection) {
          return editor.commands.addBlockableTodoItem();
        }

        // Otherwise, allow normal Enter behavior
        return false;
      },
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Find positions of status update heading and notes heading
        let statusUpdatePos = -1;
        let notesHeadingPos = -1;
        let moodHeadingPos = -1;
        state.doc.descendants((node, pos) => {
          if (node.type.name === "statusUpdateHeading") {
            statusUpdatePos = pos;
          } else if (node.type.name === "notesHeading") {
            notesHeadingPos = pos;
          } else if (node.type.name === "moodHeading") {
            moodHeadingPos = pos;
          }
        });

        // Check if we're between status update heading and notes heading
        const currentPos = $from.pos;
        const isInStatusUpdateSection =
          statusUpdatePos !== -1 &&
          notesHeadingPos !== -1 &&
          moodHeadingPos !== -1 &&
          currentPos > statusUpdatePos &&
          currentPos < notesHeadingPos &&
          currentPos < moodHeadingPos;

        // Only apply special blockable todo item logic within the status update section
        if (!isInStatusUpdateSection) {
          return false; // Allow normal backspace behavior outside status update section
        }

        // Find the parent blockable todo item first
        let todoItemDepth = -1;
        let todoItemNode = null;
        for (let i = $from.depth; i >= 0; i--) {
          if ($from.node(i).type.name === "blockableTodoListItem") {
            todoItemDepth = i;
            todoItemNode = $from.node(i);
            break;
          }
        }

        if (todoItemDepth === -1 || !todoItemNode) {
          return false; // Not in a blockable todo item
        }

        // Check if this backspace would delete the entire blockable todo item
        // This happens when:
        // 1. We're at the start of the first paragraph in the todo item
        // 2. The todo item only has one paragraph
        // 3. That paragraph is empty
        const currentNode = $from.parent;
        const isAtStart = $from.parentOffset === 0;
        const isInParagraph = currentNode.type.name === "paragraph";
        const isParagraphEmpty = currentNode.textContent.length === 0;

        // Check if this is the first child of the todo item
        const todoItemPos = $from.before(todoItemDepth);
        const firstChildPos = todoItemPos + 1;
        const isFirstChild = $from.before() === firstChildPos;

        // Count children in the todo item
        let childCount = 0;
        todoItemNode.forEach(() => childCount++);

        // Only proceed if this would delete the entire todo item
        const wouldDeleteEntireTodoItem =
          isAtStart && isInParagraph && isParagraphEmpty && isFirstChild && childCount === 1;

        if (!wouldDeleteEntireTodoItem) {
          return false; // Allow deletion of paragraphs/content within todo items
        }

        // Find the parent blockableTodoList
        let parentList = null;
        let parentListDepth = -1;
        for (let i = todoItemDepth - 1; i >= 0; i--) {
          const node = $from.node(i);
          if (node.type.name === "blockableTodoList") {
            parentList = node;
            parentListDepth = i;
            break;
          }
        }

        if (!parentList) {
          return false; // Not in a blockableTodoList
        }

        // Count blockable todo items in the parent list and find previous item
        let todoItemCount = 0;
        let previousTodoItemPos = -1;
        let currentTodoItemIndex = -1;
        let itemIndex = 0;

        const parentListPos = $from.before(parentListDepth);

        parentList.forEach((child, offset) => {
          if (child.type.name === "blockableTodoListItem") {
            const childPos = parentListPos + offset + 1;

            if (childPos === todoItemPos) {
              currentTodoItemIndex = itemIndex;
            } else if (currentTodoItemIndex === -1) {
              // This item comes before the current one
              previousTodoItemPos = childPos;
            }

            todoItemCount++;
            itemIndex++;
          }
        });

        // If there's only one item left, prevent deletion of the todo item
        if (todoItemCount <= 1) {
          return true; // Consume the event to prevent deletion
        }

        // Prevent deletion of the first todo item
        if (currentTodoItemIndex === 0) {
          return true; // Consume the event to prevent deletion of first item
        }

        // If we have a previous todo item, delete current item and move cursor to previous
        if (previousTodoItemPos !== -1) {
          const tr = state.tr;

          // Delete the current todo item
          const currentItemStart = todoItemPos;
          const currentItemEnd = currentItemStart + todoItemNode.nodeSize;
          tr.delete(currentItemStart, currentItemEnd);

          // Find the end of the previous todo item's first paragraph
          const prevItemResolvedPos = tr.doc.resolve(previousTodoItemPos);
          let targetPos = previousTodoItemPos;

          // Look for the first paragraph in the previous todo item
          const prevTodoItem = prevItemResolvedPos.nodeAfter;
          if (prevTodoItem && prevTodoItem.type.name === "blockableTodoListItem") {
            prevTodoItem.forEach((child, offset) => {
              if (child.type.name === "paragraph") {
                // Position at the end of this paragraph
                targetPos = previousTodoItemPos + offset + 2 + child.content.size;
                return false; // Stop iteration
              }
            });
          }

          // Set cursor position at the end of the previous todo item's content
          tr.setSelection(TextSelection.near(tr.doc.resolve(targetPos)));

          editor.view.dispatch(tr);
          return true;
        }

        // Otherwise, allow normal backspace behavior
        return false;
      },
    };
  },
});
