import { useEffect, useState } from "react";
import { countJSONStats } from "@/utils/task-item-counter";
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

export const AsyncStatusEditor = () => {
  const [initialContent, setInitialContent] = useState<null | JSONContent>(
    null,
  );
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [taskItemCount, setTaskItemCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [openNode, setOpenNode] = useState(false);
  const [openLink, setOpenLink] = useState(false);

  const debouncedUpdates = useDebouncedCallback(async (editor: Editor) => {
    const json = editor.getJSON();
    const stats = countJSONStats(json);
    setTaskItemCount(stats.taskItems);
    setWordCount(stats.words);
    window.localStorage.setItem("html-content", editor.getHTML());
    window.localStorage.setItem("json-content", JSON.stringify(json));
    setSaveStatus("Saved");
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
          className="bg-background relative min-h-[500px] w-full p-4 sm:mb-[calc(20vh)] sm:rounded-lg"
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
            <div className="absolute top-0 right-0 left-0 flex items-center justify-between gap-2 px-4">
              <EditorStatus
                saveStatus={saveStatus}
                taskItemCount={taskItemCount}
                wordCount={wordCount}
              />
            </div>
          }
        >
          <div className="flex items-center gap-2">
            <AddStatusUpdateButton />
            <EmojiSelector />
          </div>
          <EditorCommand className="border-muted bg-background z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="text-muted-foreground px-2">
              No results
            </EditorCommandEmpty>
            <ConnectedEditorCommandList />
          </EditorCommand>

          <EditorBubble className="border-muted bg-background flex w-fit max-w-[90vw] overflow-hidden rounded-md border shadow-xl">
            {/* <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} /> */}
            {/* <Separator orientation="vertical" /> */}
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
          "bg-accent text-muted-foreground rounded-lg px-2 py-1 text-sm",
          wordCount ? "block" : "hidden",
        )}
      >
        {taskItemCount} update items, {wordCount} words
      </div>

      <div className="flex h-auto items-center gap-2 p-0">
        <Button
          className={cn(wordCount ? "flex" : "hidden")}
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
            "bg-accent text-muted-foreground rounded-lg px-2 py-1 text-sm",
            wordCount ? "block" : "hidden",
          )}
        >
          {saveStatus}
        </div>
      </div>
    </>
  );
}
