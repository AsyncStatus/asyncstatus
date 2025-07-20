import { dayjs } from "@asyncstatus/dayjs";
import { Calendar } from "@asyncstatus/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@asyncstatus/ui/components/popover";
import { cn } from "@asyncstatus/ui/lib/utils";
import type { CommandProps } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { NodeViewProps } from "@tiptap/react";
import { mergeAttributes, Node, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface StatusUpdateHeadingOptions {
  /** Additional CSS classes applied to the heading element */
  HTMLAttributes?: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    statusUpdateHeading: {
      /**
       * Set the date for the status update heading
       */
      setStatusUpdateDate: (isoDate: string) => ReturnType;
    };
  }
}

const StatusUpdateHeadingComponent = ({ node, updateAttributes, editor }: NodeViewProps) => {
  const isEditable = editor.isEditable;
  const [open, setOpen] = useState(false);
  const date = node.attrs.date;

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      updateAttributes({ date: dayjs.utc(selectedDate).startOf("day").toISOString() });
      setOpen(false);
    }
  };

  return (
    <NodeViewWrapper className="status-update-heading">
      <h2 className="flex text-2xl font-bold items-start gap-1.5 flex-col sm:flex-row">
        Status update
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              disabled={!isEditable}
              type="button"
              className={cn(
                "text-muted-foreground flex items-center justify-start rounded-lg text-left",
                open && "text-foreground",
              )}
            >
              {date ? dayjs.utc(date).format("MMMM D, YYYY") : <span>Pick a date</span>}
              {isEditable && (
                <ChevronDown
                  className={cn("mx-1 size-6 transition-transform", open && "-rotate-180")}
                />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              autoFocus
              className="rounded-md border shadow-sm"
              captionLayout="dropdown"
              timeZone="UTC"
              mode="single"
              selected={dayjs.utc(date).toDate()}
              onSelect={handleDateSelect}
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
        parseHTML: (element) => element.getAttribute("data-date"),
        renderHTML: (attributes) => ({ "data-date": attributes.date }),
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

  renderHTML({ HTMLAttributes, node }) {
    return [
      "h2",
      mergeAttributes(HTMLAttributes, this.options.HTMLAttributes ?? {}, {
        "data-status-update": "",
        contenteditable: "false",
        "data-date": node.attrs.date,
      }),
      ["span", "Status update"],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StatusUpdateHeadingComponent);
  },

  addCommands() {
    return {
      setStatusUpdateDate:
        (isoDate: string) =>
        ({ commands }: CommandProps) => {
          return commands.updateAttributes("statusUpdateHeading", { date: isoDate });
        },
    };
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
