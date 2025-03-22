import { type PropsWithChildren } from "react";
import { SimpleHeader } from "@asyncstatus/ui/components/simple-header";

export function SimpleLayout(props: PropsWithChildren<{ href: string }>) {
  return (
    <>
      <SimpleHeader href={props.href} />
      <main className="container mx-auto flex flex-col items-center justify-center pt-12">
        {props.children}
      </main>
    </>
  );
}
