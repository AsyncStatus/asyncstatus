import type { Editor, Range } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import type { ReactNode, RefObject } from "react";
import tippy, { type GetReferenceClientRect, type Instance, type Props } from "tippy.js";

import { EditorCommandOut } from "../components/editor-command";

const Command = Extension.create({
  name: "slash-command",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      } as SuggestionOptions,
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

const renderItems = (elementRef?: RefObject<Element> | null) => {
  let component: ReactRenderer | null = null;
  let popup: Instance<Props>[] | null = null;

  return {
    onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
      component = new ReactRenderer(EditorCommandOut, {
        props,
        editor: props.editor,
      });

      const { selection } = props.editor.state;

      const parentNode = selection.$from.node(selection.$from.depth);
      const blockType = parentNode.type.name;

      if (blockType === "codeBlock") {
        return false;
      }

      popup = tippy("body" as any, {
        getReferenceClientRect: props.clientRect as any,
        appendTo: () => (elementRef ? elementRef.current : document.body),
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },
    onUpdate: (props: { editor: Editor; clientRect: GetReferenceClientRect }) => {
      component?.updateProps(props);

      popup?.[0]?.setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        popup?.[0]?.hide();

        return true;
      }

      return (component?.ref as any)?.onKeyDown(props);
    },
    onExit: () => {
      popup?.[0]?.destroy();
      component?.destroy();
    },
  };
};

export interface SuggestionItem {
  title: string;
  description: string;
  icon: ReactNode;
  searchTerms?: string[];
  command?: (props: { editor: Editor; range: Range }) => void;
}

export const createSuggestionItems = (items: SuggestionItem[]) => items;

export const handleCommandNavigation = (event: KeyboardEvent) => {
  if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
    const slashCommand = document.querySelector("#slash-command");
    if (slashCommand) {
      return true;
    }
  }
};

export { Command, renderItems };
