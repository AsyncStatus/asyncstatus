import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface StatusUpdateHeadingOptions {
  /** Additional CSS classes applied to the heading element */
  HTMLAttributes?: Record<string, any>;
}

/**
 * A read-only heading that always renders the label "Status update".
 */
export const StatusUpdateHeading = Node.create<StatusUpdateHeadingOptions>({
  name: "statusUpdateHeading",

  group: "block",
  atom: true, // treat as a single entity
  selectable: false,
  draggable: false,
  // No inner content, so it can't be edited from the inside
  content: "",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "h2[data-status-update]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "h2",
      mergeAttributes(HTMLAttributes, this.options.HTMLAttributes ?? {}, {
        "data-status-update": "",
        contenteditable: "false",
      }),
      "Status update",
    ];
  },

  addProseMirrorPlugins() {
    const type = this.type;

    return [
      new Plugin({
        key: new PluginKey("statusUpdateHeadingGuard"),
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

          // Prevent transactions that remove the node
          return newCount >= oldCount;
        },
      }),
    ];
  },
});
