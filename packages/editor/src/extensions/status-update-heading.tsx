import { useState } from "react";
import { Calendar } from "@asyncstatus/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@asyncstatus/ui/components/popover";
import { cn } from "@asyncstatus/ui/lib/utils";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  mergeAttributes,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";

export interface StatusUpdateHeadingOptions {
  /** Additional CSS classes applied to the heading element */
  HTMLAttributes?: Record<string, any>;
}

const StatusUpdateHeadingComponent = ({
  node,
  updateAttributes,
}: NodeViewProps) => {
  const [open, setOpen] = useState(false);
  const date = node.attrs.date ? new Date(node.attrs.date) : new Date();

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      updateAttributes({ date: selectedDate.toISOString() });
      setOpen(false);
    }
  };

  return (
    <NodeViewWrapper className="status-update-heading">
      <h2 className="flex items-center gap-1.5 text-2xl font-bold">
        Status update
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "text-muted-foreground flex items-center justify-start rounded-lg text-left",
                open && "text-foreground",
              )}
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <ChevronDown
                className={cn(
                  "mx-1 size-6 transition-transform",
                  open && "-rotate-180",
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </h2>
    </NodeViewWrapper>
  );
};

/**
 * A heading that renders "Status update" with a date selector.
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

  addAttributes() {
    return {
      date: {
        default: new Date().toISOString(),
        parseHTML: (element) => element.getAttribute("data-date"),
        renderHTML: (attributes) => ({
          "data-date": attributes.date,
        }),
      },
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
      ["span", "Status update"],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StatusUpdateHeadingComponent);
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
