import { useEffect, useState, type PropsWithChildren } from "react";
import { countJSONStats } from "@/utils/count-json-stats";
import {
  extractStatusUpdateData,
  type ExtractedStatusUpdateData,
} from "@/utils/extract-status-update-data";
import { Button } from "@asyncstatus/ui/components/button";
import { Separator } from "@asyncstatus/ui/components/separator";
import { UndoIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import type { Editor, JSONContent } from "@tiptap/core";
import { useCurrentEditor } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";

import { AddStatusUpdateButton } from "@/components/add-status-update-button";
import EditorBubble from "@/components/editor-bubble";
import { EditorCommand, EditorCommandList } from "@/components/editor-command";
import EditorCommandItem, {
  EditorCommandEmpty,
} from "@/components/editor-command-item";
import { EditorContent } from "@/components/editor-content";
import { EditorRoot } from "@/components/editor-root";
import { EmojiSelector } from "@/components/emoji-selector";
import { LinkSelector } from "@/components/link-selector";
import { TextButtons } from "@/components/text-buttons";

import { handleCommandNavigation } from "../extensions/slash-command";
import { asyncStatusEditorDefaultContent } from "./asyncstatus-editor-default-content";
import { asyncStatusEditorExtensions } from "./asyncstatus-editor-extensions";
import {
  getSuggestionItems,
  slashCommand,
} from "./asyncstatus-editor-suggestion-items";

const extensions = [...asyncStatusEditorExtensions, slashCommand];

export const AsyncStatusEditor = (
  props: PropsWithChildren<{
    onUpdate?: (statusUpdateData: ExtractedStatusUpdateData) => void;
  }>,
) => {
  const [initialContent, setInitialContent] = useState<null | JSONContent>(
    null,
  );
  const [saveStatus, setSaveStatus] = useState("Saved locally");
  const [taskItemCount, setTaskItemCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [openLink, setOpenLink] = useState(false);

  const debouncedUpdates = useDebouncedCallback(async (editor: Editor) => {
    const json = editor.getJSON();
    const stats = countJSONStats(json);
    setTaskItemCount(stats.taskItems);
    setWordCount(stats.words);
    window.localStorage.setItem("html-content", editor.getHTML());
    window.localStorage.setItem("json-content", JSON.stringify(json));
    setSaveStatus("Saved locally");
    props.onUpdate?.(extractStatusUpdateData(json));
  }, 500);

  useEffect(() => {
    function setCounts(json: JSONContent) {
      const stats = countJSONStats(json);
      setTaskItemCount(stats.taskItems);
      setWordCount(stats.words);
    }

    const content = window.localStorage.getItem("json-content");
    if (
      (content &&
        content === `{"type":"doc","content":[{"type":"paragraph"}]}`) ||
      !content
    ) {
      setInitialContent(asyncStatusEditorDefaultContent);
      setCounts(asyncStatusEditorDefaultContent);
      return;
    }

    const json = JSON.parse(content);
    setInitialContent(json);
    setCounts(json);
  }, []);

  if (!initialContent) return null;

  return (
    <div className="prose prose-neutral dark:prose-invert prose-sm relative w-full max-w-none">
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          className="bg-background relative w-full p-4 sm:mb-[calc(20vh)] sm:rounded-lg"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            attributes: {
              class:
                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
            },
          }}
          onUpdate={({ editor }) => {
            debouncedUpdates(editor);
            setSaveStatus("Unsaved");
          }}
          slotBefore={
            <div
              className={cn(
                "absolute top-0 right-0 left-0 flex items-center justify-between gap-2 px-4",
              )}
            >
              <EditorStatus
                saveStatus={saveStatus}
                taskItemCount={taskItemCount}
                wordCount={wordCount}
              />
            </div>
          }
        >
          <div className="flex items-center gap-2">
            <EmojiSelector />
            <AddStatusUpdateButton />
            {props.children}
          </div>
          <EditorCommand className="border-muted bg-background z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="text-muted-foreground px-2">
              No results
            </EditorCommandEmpty>
            <ConnectedEditorCommandList />
          </EditorCommand>

          <EditorBubble className="border-muted bg-background flex w-fit max-w-[90vw] overflow-hidden rounded-md border shadow-xl">
            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <TextButtons />
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  );
};

function ConnectedEditorCommandList() {
  const { editor } = useCurrentEditor();

  return (
    <EditorCommandList>
      {(editor ? getSuggestionItems(editor) : []).map((item) => (
        <EditorCommandItem
          value={item.title}
          onCommand={(val) => item?.command?.(val)}
          className="hover:bg-accent aria-selected:bg-accent flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm"
          key={item.title}
        >
          <div className="border-muted bg-background flex h-10 w-10 items-center justify-center rounded-md border">
            {item.icon}
          </div>
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-muted-foreground text-xs">{item.description}</p>
          </div>
        </EditorCommandItem>
      ))}
    </EditorCommandList>
  );
}

function EditorStatus({
  saveStatus,
  taskItemCount,
  wordCount,
}: {
  saveStatus: string;
  taskItemCount: number;
  wordCount: number;
}) {
  const { editor } = useCurrentEditor();

  return (
    <>
      <div
        className={cn(
          "bg-accent text-muted-foreground rounded-lg px-2 py-1 text-sm opacity-100 transition-opacity duration-75",
          !wordCount && "opacity-0",
        )}
      >
        {taskItemCount} update item{taskItemCount === 1 ? "" : "s"}, {wordCount}{" "}
        word{wordCount === 1 ? "" : "s"}
      </div>

      <div className="flex h-auto items-center gap-2 p-0">
        <Button
          className={cn(
            "opacity-100 transition-opacity duration-75",
            !wordCount && "opacity-0",
          )}
          variant="ghost"
          size="sm"
          onClick={() => {
            window.localStorage.removeItem("html-content");
            window.localStorage.removeItem("json-content");
            editor?.commands.setContent(asyncStatusEditorDefaultContent, true);
          }}
        >
          <UndoIcon className="size-4" />
          Reset
        </Button>

        <div
          className={cn(
            "bg-accent text-muted-foreground rounded-lg px-2 py-1 text-sm opacity-100 transition-opacity duration-75",
            !wordCount && "opacity-0",
          )}
        >
          {saveStatus}
        </div>
      </div>
    </>
  );
}
