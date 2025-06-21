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
import dayjs from "dayjs";
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
import { getAsyncStatusEditorDefaultContent } from "./asyncstatus-editor-default-content";
import { asyncStatusEditorExtensions } from "./asyncstatus-editor-extensions";
import {
  getSuggestionItems,
  slashCommand,
} from "./asyncstatus-editor-suggestion-items";

const extensions = [...asyncStatusEditorExtensions, slashCommand];

// Helper function to get the status update date from the editor
function getStatusUpdateDate(editor: Editor): Date | null {
  let dateString: string | null = null;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "statusUpdateHeading" && node.attrs.date) {
      dateString = node.attrs.date;
      return false; // Stop searching once found
    }
  });
  return dateString ? new Date(dateString) : null;
}

export const AsyncStatusEditor = (
  props: PropsWithChildren<{
    date?: string;
    onDateChange?: (date: string) => void;
    initialContent?: JSONContent;
    onUpdate?: (
      statusUpdateData: ExtractedStatusUpdateData & { editorJson: JSONContent },
    ) => void;
  }>,
) => {
  const [initialContent, setInitialContent] = useState<null | JSONContent>(
    props.initialContent ?? null,
  );
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [taskItemCount, setTaskItemCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [openLink, setOpenLink] = useState(false);

  function onUpdate(editor: Editor) {
    const json = editor.getJSON();
    const stats = countJSONStats(json);
    setTaskItemCount(stats.taskItems);
    setWordCount(stats.words);

    if (props.date) {
      window.localStorage.setItem(
        `html-content-${props.date}`,
        editor.getHTML(),
      );
      window.localStorage.setItem(
        `json-content-${props.date}`,
        JSON.stringify(json),
      );
    } else {
      // Fallback to regular keys if no date found
      window.localStorage.setItem("html-content", editor.getHTML());
      window.localStorage.setItem("json-content", JSON.stringify(json));
    }

    setSaveStatus("Saved");
    props.onUpdate?.({
      ...extractStatusUpdateData(json),
      editorJson: json,
    });
  }

  const debouncedOnUpdate = useDebouncedCallback(onUpdate, 500);

  useEffect(() => {
    function setCounts(json: JSONContent) {
      const stats = countJSONStats(json);
      setTaskItemCount(stats.taskItems);
      setWordCount(stats.words);
    }

    if (props.initialContent) {
      setInitialContent(props.initialContent);
      setCounts(props.initialContent);

      // Save the initial content to local storage (JSON only, HTML will be saved by the editor)
      if (props.date) {
        window.localStorage.setItem(
          `json-content-${props.date}`,
          JSON.stringify(props.initialContent),
        );
      } else {
        window.localStorage.setItem(
          "json-content",
          JSON.stringify(props.initialContent),
        );
      }

      return;
    }

    const content = props.date
      ? window.localStorage.getItem(`json-content-${props.date}`)
      : window.localStorage.getItem("json-content");

    if (
      (content &&
        content === `{"type":"doc","content":[{"type":"paragraph"}]}`) ||
      !content
    ) {
      const defaultContent = getAsyncStatusEditorDefaultContent(
        props.date
          ? dayjs(props.date, "YYYY-MM-DD", true).toISOString()
          : dayjs().startOf("day").toISOString(),
      );
      setInitialContent(defaultContent);
      setCounts(defaultContent);
      return;
    }

    const json = JSON.parse(content);
    setInitialContent(json);
    setCounts(json);
  }, [props.date, props.initialContent]);

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
          onCreate={({ editor }) => {
            if (props.date) {
              editor.commands.setStatusUpdateDate(
                dayjs(props.date, "YYYY-MM-DD", true).toDate(),
              );
            }
            onUpdate(editor);
          }}
          onUpdate={({ editor }) => {
            const editorDate = getStatusUpdateDate(editor);
            if (
              editorDate &&
              props.date &&
              dayjs(editorDate).startOf("day").format("YYYY-MM-DD") !==
                props.date
            ) {
              props.onDateChange?.(
                dayjs(editorDate).startOf("day").format("YYYY-MM-DD"),
              );
              editor.commands.setStatusUpdateDate(
                dayjs(props.date, "YYYY-MM-DD", true).toDate(),
              );
              return;
            }

            if (props.date) {
              editor.commands.setStatusUpdateDate(
                dayjs(props.date, "YYYY-MM-DD", true).toDate(),
              );
            }

            debouncedOnUpdate(editor);
            setSaveStatus("Unsaved");
          }}
          slotBefore={
            <div
              className={cn(
                "absolute top-0 right-0 left-0 flex items-center justify-between gap-2 px-4",
              )}
            >
              <EditorStatus
                date={props.date ?? ""}
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
  date,
  saveStatus,
  taskItemCount,
  wordCount,
}: {
  date: string;
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
            window.localStorage.removeItem(`html-content-${date}`);
            window.localStorage.removeItem(`json-content-${date}`);
            editor?.commands.setContent(
              getAsyncStatusEditorDefaultContent(
                dayjs().startOf("day").toISOString(),
              ),
              true,
            );
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
