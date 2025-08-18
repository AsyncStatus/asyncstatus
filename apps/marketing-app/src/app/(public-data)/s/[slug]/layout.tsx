import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import Link from "next/link";
import type { PropsWithChildren } from "react";

export default function Layout(props: PropsWithChildren) {
  return (
    <>
      <header className="mb-12 flex items-center justify-center p-6 z-10">
        <nav>
          <Link
            className="flex items-center gap-0.5 bg-background rounded-lg p-4"
            href="/"
            target="_blank"
            aria-label="AsyncStatus Home"
          >
            <AsyncStatusLogo className="h-4 w-auto" />
          </Link>
        </nav>
      </header>

      {props.children}
    </>
  );
}
