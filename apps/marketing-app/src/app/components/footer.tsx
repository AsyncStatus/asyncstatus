import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import Link from "next/link";

import { WaitlistDialog } from "./waitlist-dialog";

export function Footer() {
  return (
    <footer className="border-border mt-36 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <AsyncStatusLogo className="h-3.5 w-auto" />
              <span className="text-lg font-medium">AsyncStatus</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Async status updates for remote startups.
              <br />
              Built for high-agency teams that value their time.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-sm">
            <div className="flex flex-col gap-3">
              <span className="font-medium">Product</span>
              <div className="text-muted-foreground flex flex-col gap-2">
                <Link href="#how-it-works" className="hover:text-foreground transition-colors">
                  How it works
                </Link>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Features
                </Link>
                <Link href="#team" className="hover:text-foreground transition-colors">
                  Use cases
                </Link>
                <WaitlistDialog buttonSize="sm" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-medium">Company</span>
              <div className="text-muted-foreground flex flex-col gap-2">
                <a
                  href="mailto:hi@asyncstatus.com"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-medium">Legal</span>
              <div className="text-muted-foreground flex flex-col gap-2">
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
                <Link href="/cookies" className="hover:text-foreground transition-colors">
                  Cookies
                </Link>
                <Link href="/acceptable-use" className="hover:text-foreground transition-colors">
                  Acceptable Use
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground mt-12 flex flex-col justify-between gap-4 border-t pt-4 text-sm sm:flex-row">
          <div>© {new Date().getFullYear()} AsyncStatus. All rights reserved.</div>
          <div className="flex gap-4">
            <Link
              href="https://x.com/asyncstatus"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              𝕏 (Twitter)
            </Link>
            <Link
              href="https://github.com/asyncstatus"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
