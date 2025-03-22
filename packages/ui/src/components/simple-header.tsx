import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";

export function SimpleHeader(props: { href: string }) {
  return (
    <header className="mb-16 flex items-center justify-center p-6">
      <nav>
        <a
          className="flex items-center gap-0.5"
          href={props.href}
          aria-label="AsyncStatus Home"
        >
          <AsyncStatusLogo className="h-4 w-auto" />
        </a>
      </nav>
    </header>
  );
}
