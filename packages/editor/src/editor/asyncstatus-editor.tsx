import { dayjs } from "@asyncstatus/dayjs";
import { Separator } from "@asyncstatus/ui/components/separator";
import { cn } from "@asyncstatus/ui/lib/utils";
import type { Editor, JSONContent } from "@tiptap/core";
import { useCurrentEditor } from "@tiptap/react";
import { memo, type PropsWithChildren, useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import EditorBubble from "../components/editor-bubble";
import { EditorCommand, EditorCommandList } from "../components/editor-command";
import EditorCommandItem, { EditorCommandEmpty } from "../components/editor-command-item";
import { EditorContent } from "../components/editor-content";
import { EditorRoot } from "../components/editor-root";
import { EmojiSelector } from "../components/emoji-selector";
import { LinkSelector } from "../components/link-selector";
import { TextButtons } from "../components/text-buttons";
import { handleCommandNavigation } from "../extensions/slash-command";
import { countJSONStats } from "../utils/count-json-stats";
import {
  type ExtractedStatusUpdateData,
  extractStatusUpdateData,
} from "../utils/extract-status-update-data";
import { getAsyncStatusEditorDefaultContent } from "./asyncstatus-editor-default-content";
import { asyncStatusEditorExtensions } from "./asyncstatus-editor-extensions";
import { getSuggestionItems, slashCommand } from "./asyncstatus-editor-suggestion-items";

const extensions = [...asyncStatusEditorExtensions, slashCommand];

// Helper function to get the status update date from the editor
function getStatusUpdateDate(editor: Editor): dayjs.Dayjs | null {
  let dateString: string | null = null;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "statusUpdateHeading" && node.attrs.date) {
      dateString = node.attrs.date;
      return false; // Stop searching once found
    }
  });
  return dateString ? dayjs.utc(dateString) : null;
}

const AsyncStatusEditorUnmemoized = (
  props: PropsWithChildren<{
    date?: string;
    onDateChange?: (date: string) => void;
    initialContent?: JSONContent;
    readonly?: boolean;
    localStorageKeyPrefix?: string;
    onUpdate?: (statusUpdateData: ExtractedStatusUpdateData & { editorJson: JSONContent }) => void;
  }>,
) => {
  const [initialContent, setInitialContent] = useState<null | JSONContent>(
    props.initialContent ?? null,
  );
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [inProgressTaskItemCount, setInProgressTaskItemCount] = useState(0);
  const [doneTaskItemCount, setDoneTaskItemCount] = useState(0);
  const [blockedTaskItemCount, setBlockedTaskItemCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [openLink, setOpenLink] = useState(false);

  const onUpdate = useCallback(
    (editor: Editor) => {
      const json = editor.getJSON();
      const stats = countJSONStats(json);
      setInProgressTaskItemCount(stats.inProgressTaskItems);
      setDoneTaskItemCount(stats.doneTaskItems);
      setBlockedTaskItemCount(stats.blockedTaskItems);
      setWordCount(stats.words);

      if (props.date) {
        window.localStorage.setItem(
          `${props.localStorageKeyPrefix ? `${props.localStorageKeyPrefix}-` : ""}json-content-${props.date}`,
          JSON.stringify(json),
        );
      } else {
        // Fallback to regular keys if no date found
        window.localStorage.setItem(
          `${props.localStorageKeyPrefix ? `${props.localStorageKeyPrefix}-` : ""}json-content`,
          JSON.stringify(json),
        );
      }

      setSaveStatus("Saved");
      const data = extractStatusUpdateData(json);
      props.onUpdate?.({ ...data, editorJson: json, date: data.date });
    },
    [props.date, props.localStorageKeyPrefix, props.onUpdate],
  );

  const debouncedOnUpdate = useDebouncedCallback(onUpdate, 600);

  useEffect(() => {
    function setCounts(json: JSONContent) {
      const stats = countJSONStats(json);
      setInProgressTaskItemCount(stats.inProgressTaskItems);
      setDoneTaskItemCount(stats.doneTaskItems);
      setBlockedTaskItemCount(stats.blockedTaskItems);
      setWordCount(stats.words);
    }

    if (props.initialContent) {
      setInitialContent(props.initialContent);
      setCounts(props.initialContent);

      // Save the initial content to local storage (JSON only)
      if (props.date) {
        window.localStorage.setItem(
          `${props.localStorageKeyPrefix ? `${props.localStorageKeyPrefix}-` : ""}json-content-${props.date}`,
          JSON.stringify(props.initialContent),
        );
      } else {
        window.localStorage.setItem(
          `${props.localStorageKeyPrefix ? `${props.localStorageKeyPrefix}-` : ""}json-content`,
          JSON.stringify(props.initialContent),
        );
      }

      return;
    }

    const content = props.date
      ? window.localStorage.getItem(
          `${props.localStorageKeyPrefix ? `${props.localStorageKeyPrefix}-` : ""}json-content-${props.date}`,
        )
      : window.localStorage.getItem(
          `${props.localStorageKeyPrefix ? `${props.localStorageKeyPrefix}-` : ""}json-content`,
        );

    if ((content && content === `{"type":"doc","content":[{"type":"paragraph"}]}`) || !content) {
      const defaultContent = getAsyncStatusEditorDefaultContent(
        props.date
          ? dayjs.utc(props.date).startOf("day").toISOString()
          : dayjs.utc().startOf("day").toISOString(),
      );
      setInitialContent(defaultContent);
      setCounts(defaultContent);
      return;
    }

    const json = JSON.parse(content);
    setInitialContent(json);
    setCounts(json);
  }, [props.date, props.initialContent, props.localStorageKeyPrefix]);

  if (!initialContent) return null;

  return (
    <div className="prose prose-neutral dark:prose-invert prose-sm relative w-full max-w-none">
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
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
                dayjs.utc(props.date).startOf("day").toISOString(),
              );
            }
            onUpdate(editor);
            if (props.readonly) {
              editor.setEditable(false);
            } else {
              editor.setEditable(true);
            }
          }}
          onUpdate={({ editor }) => {
            const editorDate = getStatusUpdateDate(editor);
            if (editorDate && props.date && editorDate.toISOString() !== props.date) {
              editor.commands.setStatusUpdateDate(editorDate.toISOString());
              props.onDateChange?.(editorDate.toISOString());
              return;
            }

            if (props.date) {
              editor.commands.setStatusUpdateDate(props.date);
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
                readonly={props.readonly ?? false}
                date={props.date ?? ""}
                saveStatus={saveStatus}
                inProgressTaskItemCount={inProgressTaskItemCount}
                doneTaskItemCount={doneTaskItemCount}
                blockedTaskItemCount={blockedTaskItemCount}
                wordCount={wordCount}
              />
            </div>
          }
        >
          <div className="flex items-start gap-2 flex-wrap">
            {!props.readonly && (
              <>
                <Separator className="my-6" />
                <EmojiSelector />
              </>
            )}
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

export type AsyncStatusEditorProps = Parameters<typeof AsyncStatusEditorUnmemoized>[0];
export type AsyncStatusEditorOnUpdate = AsyncStatusEditorProps["onUpdate"];
export type AsyncStatusEditorOnUpdateArgs = Parameters<NonNullable<AsyncStatusEditorOnUpdate>>[0];

export const AsyncStatusEditor = memo(AsyncStatusEditorUnmemoized, (prevProps, nextProps) => {
  return (
    prevProps.date === nextProps.date &&
    prevProps.readonly === nextProps.readonly &&
    prevProps.localStorageKeyPrefix === nextProps.localStorageKeyPrefix &&
    prevProps.initialContent === nextProps.initialContent &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onDateChange === nextProps.onDateChange
  );
});

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
  inProgressTaskItemCount,
  doneTaskItemCount,
  blockedTaskItemCount,
  wordCount,
  readonly,
}: {
  date: string;
  saveStatus: string;
  inProgressTaskItemCount: number;
  doneTaskItemCount: number;
  blockedTaskItemCount: number;
  wordCount: number;
  readonly: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "bg-accent text-muted-foreground rounded-lg px-2 py-1 text-xs opacity-100 transition-opacity duration-75",
            !wordCount && "opacity-0",
          )}
        >
          {blockedTaskItemCount} blocker{blockedTaskItemCount === 1 ? "" : "s"},{" "}
          {inProgressTaskItemCount} in progress and {doneTaskItemCount} done items
        </div>

        <div
          className={cn(
            "bg-accent text-muted-foreground rounded-lg px-2 py-1 text-xs opacity-100 transition-opacity duration-75",
            !wordCount && "opacity-0",
          )}
        >
          {wordCount} word{wordCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex h-auto items-center gap-2 p-0">
        {/* <Button
          className={cn("opacity-100 transition-opacity duration-75", !wordCount && "opacity-0")}
          variant="ghost"
          size="sm"
          onClick={() => {
            window.localStorage.removeItem(`json-content-${date}`);
            editor?.commands.setContent(
              getAsyncStatusEditorDefaultContent(dayjs().startOf("day").toISOString()),
              true,
            );
          }}
        >
          <UndoIcon className="size-4" />
          Reset
        </Button> */}

        {!readonly && (
          <div
            className={cn(
              "bg-accent text-muted-foreground rounded-lg px-2 py-1 text-sm opacity-100 transition-opacity duration-75",
              !wordCount && "opacity-0",
            )}
          >
            {saveStatus}
          </div>
        )}
      </div>
    </>
  );
}
