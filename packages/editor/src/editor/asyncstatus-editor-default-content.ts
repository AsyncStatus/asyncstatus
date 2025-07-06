import type { JSONContent } from "@tiptap/core";

export const getAsyncStatusEditorDefaultContent = (date: string): JSONContent => {
  return {
    type: "doc",
    content: [
      { type: "statusUpdateHeading", attrs: { date } },
      {
        type: "blockableTodoList",
        content: [
          {
            type: "blockableTodoListItem",
            attrs: { checked: false },
            content: [
              {
                type: "paragraph",
                content: [],
              },
            ],
          },
        ],
      },
      { type: "notesHeading" },
      {
        type: "paragraph",
        content: [],
      },
      { type: "moodHeading" },
      {
        type: "paragraph",
        content: [],
      },
    ],
  };
};
