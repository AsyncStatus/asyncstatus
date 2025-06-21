import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface NotesHeadingOptions {
  HTMLAttributes?: Record<string, any>;
}

export const NotesHeading = Node.create<NotesHeadingOptions>({
  name: "notesHeading",

  group: "block",
  atom: true,
  selectable: false,
  draggable: false,
  content: "", // no inner content

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "h3[data-notes-heading]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "h3",
      mergeAttributes(HTMLAttributes, this.options.HTMLAttributes ?? {}, {
        "data-notes-heading": "",
        contenteditable: "false",
      }),
      "Notes",
    ];
  },

  addProseMirrorPlugins() {
    const type = this.type;

    return [
      new Plugin({
        key: new PluginKey("notesHeadingGuard"),
        filterTransaction(transaction, state) {
          if (!transaction.docChanged) return true;

          let oldCount = 0;
          state.doc.descendants((node) => {
            if (node.type === type) oldCount += 1;
          });

          let newCount = 0;
          transaction.doc.descendants((node) => {
            if (node.type === type) newCount += 1;
          });

          return newCount >= oldCount;
        },
      }),
    ];
  },
});
