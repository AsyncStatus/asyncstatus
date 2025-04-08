import { type PropsWithChildren } from "react";
import { SimpleHeader } from "@asyncstatus/ui/components/simple-header";
import { cn } from "@asyncstatus/ui/lib/utils";

export function SimpleLayout(
  props: PropsWithChildren<{ href: string; className?: string }>,
) {
  return (
    <>
      <SimpleHeader href={props.href} />
      <main
        className={cn(
          "container mx-auto flex flex-col items-center justify-center pt-12",
          props.className,
        )}
      >
        {props.children}
      </main>
    </>
  );
}
