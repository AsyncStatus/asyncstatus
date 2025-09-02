import { Button } from "@asyncstatus/ui/components/button";
import Link from "next/link";
import { BrandCTA } from "./brand-copy";

export function CtaSection() {
  return (
    <section className="mt-48">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <h2 className="text-4xl font-bold text-balance sm:text-5xl">Done with standups?</h2>
        <p className="text-muted-foreground mt-6 text-lg text-balance sm:text-xl">
          Remote teams are already saving hundreds of hours by dropping standups.
          <br />
          Join them and reclaim your morning focus time.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Link
            href={`${process.env.NEXT_PUBLIC_APP_URL}/sign-up`}
            className="hover:text-foreground"
          >
            <Button size="lg">
              <BrandCTA />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
