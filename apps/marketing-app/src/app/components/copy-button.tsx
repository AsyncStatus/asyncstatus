"use client";

import { CopyCheckIcon, CopyIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export function CopyButton(props: { text: string }) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(props.text);
    setCopied(true);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 1000);
  }, [props.text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      className={cn("p-1.5 rounded-md hover:bg-neutral-100 transition-colors", {
        "bg-neutral-100": copied,
      })}
      type="button"
      onClick={copy}
    >
      {copied ? (
        <CopyCheckIcon className="size-3.5 hover:scale-105 transition-transform" />
      ) : (
        <CopyIcon className="size-3.5 hover:scale-105 transition-transform" />
      )}
    </button>
  );
}
