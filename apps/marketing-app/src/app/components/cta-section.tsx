import Link from "next/link";

import { WaitlistDialog } from "./waitlist-dialog";

export function CtaSection() {
  return (
    <section className="mt-48">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <h2 className="text-4xl font-bold text-balance sm:text-5xl">Done with standups?</h2>
        <p className="text-muted-foreground mt-6 text-lg text-balance sm:text-xl">
          Remote teams are already saving hundreds of hours with async updates.
          <br />
          Join the beta and help shape how work gets shared.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <WaitlistDialog buttonSize="lg" />
        </div>
      </div>
    </section>
  );
}
