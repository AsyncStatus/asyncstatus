import { Provider } from "jotai";
import type { FC, ReactNode } from "react";
import { useRef } from "react";
import tunnel from "tunnel-rat";

import { editorStore } from "../store/editor-store";
import { EditorCommandTunnelContext } from "./editor-command";

export interface EditorProps {
  readonly children: ReactNode;
  readonly className?: string;
}

interface EditorRootProps {
  readonly children: ReactNode;
}

export const EditorRoot: FC<EditorRootProps> = ({ children }) => {
  const tunnelInstance = useRef(tunnel()).current;

  return (
    <Provider store={editorStore}>
      <EditorCommandTunnelContext.Provider value={tunnelInstance}>
        {children}
      </EditorCommandTunnelContext.Provider>
    </Provider>
  );
};
