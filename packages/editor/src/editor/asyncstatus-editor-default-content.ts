import type { JSONContent } from "@tiptap/core";

export const asyncStatusEditorDefaultContent: JSONContent = {
  type: "doc",
  content: [
    { type: "statusUpdateHeading" },
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
