import { type ReactNode } from "react";
import { useCurrentEditor } from "@tiptap/react";

import EditorBubble from "./editor-bubble";

interface MenuProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const Menu = ({ children, open, onOpenChange }: MenuProps) => {
  const { editor } = useCurrentEditor();

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? "bottom-start" : "top",
        onHidden: () => {
          onOpenChange(false);
          editor?.chain().unsetHighlight().run();
        },
      }}
      className="border-muted bg-background flex w-fit max-w-[90vw] overflow-hidden rounded-md border shadow-xl"
    >
      {children}
    </EditorBubble>
  );
};

export default Menu;
