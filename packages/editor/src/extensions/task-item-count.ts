import { Extension } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface TaskItemCountOptions {
  /**
   * The maximum number of task items that should be allowed. Defaults to `0` (unlimited).
   * @default null
   * @example 50
   */
  limit: number | null | undefined;
}

export interface TaskItemCountStorage {
  /**
   * Get the number of task items for the current document.
   * @param options The options for the task item count. (optional)
   * @param options.node The node to get the task items from. Defaults to the current document.
   */
  tasks: (options?: { node?: ProseMirrorNode }) => number;
}

/**
 * This extension allows you to count the task items of your document.
 * It's heavily inspired by the CharacterCount extension from Tiptap.
 */
export const TaskItemCount = Extension.create<
  TaskItemCountOptions,
  TaskItemCountStorage
>({
  name: "taskItemCount",

  addOptions() {
    return {
      limit: null,
    };
  },

  addStorage() {
    return {
      tasks: () => 0,
    };
  },

  onBeforeCreate() {
    // Helper to count task items inside a node
    const countTasks = (node: ProseMirrorNode): number => {
      let count = 0;
      node.descendants((child) => {
        if (child.type.name === "taskItem") {
          count += 1;
        }
      });

      return count;
    };

    this.storage.tasks = (options) => {
      const node = options?.node || this.editor.state.doc;
      return countTasks(node);
    };
  },

  addProseMirrorPlugins() {
    let initialEvaluationDone = false;

    return [
      new Plugin({
        key: new PluginKey("taskItemCount"),
        appendTransaction: (transactions, _oldState, newState) => {
          if (initialEvaluationDone) {
            return;
          }

          const limit = this.options.limit;

          if (limit === null || limit === undefined || limit === 0) {
            initialEvaluationDone = true;
            return;
          }

          const initialTasks = this.storage.tasks({ node: newState.doc });

          if (initialTasks > limit) {
            // If document already exceeds the limit, trim tasks from the start.
            // We'll simply delete overflowing content from the beginning of the document.
            // Determining exact ranges for complex documents can be tricky, so we fallback to
            // deleting nodes until we're below the limit.
            let tasksToTrim = initialTasks - limit;
            const tr = newState.tr;

            newState.doc.descendants((node, pos) => {
              if (tasksToTrim <= 0) return false;

              if (node.type.name === "taskItem") {
                tr.delete(pos, pos + node.nodeSize);
                tasksToTrim -= 1;
              }

              return tasksToTrim > 0;
            });

            console.warn(
              `[TaskItemCount] Initial content exceeded limit of ${limit} task items. Content was automatically trimmed.`,
            );

            initialEvaluationDone = true;
            return tr;
          }

          initialEvaluationDone = true;
        },
        filterTransaction: (transaction, state) => {
          const limit = this.options.limit;

          // Nothing has changed or no limit is defined. Allow.
          if (
            !transaction.docChanged ||
            limit === 0 ||
            limit === null ||
            limit === undefined
          ) {
            return true;
          }

          const oldSize = this.storage.tasks({ node: state.doc });
          const newSize = this.storage.tasks({ node: transaction.doc });

          // Everything is in the limit. Good.
          if (newSize <= limit) {
            return true;
          }

          // The limit has already been exceeded but will be reduced.
          if (oldSize > limit && newSize > limit && newSize <= oldSize) {
            return true;
          }

          // The limit has already been exceeded and will be increased further.
          if (oldSize > limit && newSize > limit && newSize > oldSize) {
            return false;
          }

          const isPaste = transaction.getMeta("paste");

          // Block all exceeding transactions that were not pasted.
          if (!isPaste) {
            return false;
          }

          // For pasted content, we try to remove the exceeding task items.
          let tasksOver = newSize - limit;
          const tr = transaction;

          // Iterate over nodes backwards from the selection head, deleting surplus task items.
          const { $head } = tr.selection;
          let pos = $head.pos;

          while (tasksOver > 0 && pos > 0) {
            const node = tr.doc.nodeAt(pos);
            if (node && node.type.name === "taskItem") {
              tr.delete(pos, pos + node.nodeSize);
              tasksOver -= 1;
            }
            pos -= 1;
          }

          const updatedSize = this.storage.tasks({ node: tr.doc });

          if (updatedSize > limit) {
            return false;
          }

          return true;
        },
      }),
    ];
  },
});
