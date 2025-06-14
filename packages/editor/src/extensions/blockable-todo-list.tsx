import { mergeAttributes, Node } from "@tiptap/core";
import type { CommandProps } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockableTodoList: {
      toggleBlockableTodoList: () => ReturnType;
    };
  }
}

export interface BlockableTodoListOptions {
  HTMLAttributes?: Record<string, any>;
}

export const BlockableTodoList = Node.create<BlockableTodoListOptions>({
  name: "blockableTodoList",

  group: "block list",

  content: "blockableTodoListItem+",

  parseHTML() {
    return [
      {
        tag: `ul[data-type="${this.name}"]`,
        priority: 51,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      mergeAttributes(this.options.HTMLAttributes ?? {}, HTMLAttributes, {
        "data-type": this.name,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleBlockableTodoList:
        () =>
        ({ commands }: CommandProps) => {
          return commands.toggleList(this.name, "blockableTodoListItem");
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-9": () => this.editor.commands.toggleBlockableTodoList(),
    };
  },
});
