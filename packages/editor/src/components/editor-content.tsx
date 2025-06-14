import { forwardRef } from "react";
import type { ReactNode } from "react";
import { EditorProvider } from "@tiptap/react";
import type { EditorProviderProps, JSONContent } from "@tiptap/react";

export type EditorContentProps = Omit<EditorProviderProps, "content"> & {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly initialContent?: JSONContent;
};

export const EditorContent = forwardRef<HTMLDivElement, EditorContentProps>(
  ({ className, children, initialContent, ...rest }, ref) => (
    <div ref={ref} className={className}>
      <EditorProvider {...rest} content={initialContent}>
        {children}
      </EditorProvider>
    </div>
  ),
);

EditorContent.displayName = "EditorContent";
