export const asyncStatusEditorDefaultContent = {
  type: "doc",
  content: [
    {
      type: "statusUpdateHeading",
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: false, blocker: false },
          content: [
            {
              type: "paragraph",
              attrs: { isEmpty: true },
              content: [],
            },
          ],
        },
      ],
    },
    {
      type: "notesHeading",
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Check items off as you wrap them up and flag anything new that's blocking you!",
        },
      ],
    },
    {
      type: "moodHeading",
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "How are you feeling today?",
        },
      ],
    },
  ],
};
