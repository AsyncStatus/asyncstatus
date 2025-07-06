import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import type { PropsWithChildren } from "react";

import { ActivePrivacyLink } from "./active-privacy-link";

export default function Layout(props: PropsWithChildren) {
  return (
    <SimpleLayout href="/" className="block max-w-prose px-4 pb-64">
      <header className="flex flex-col items-center justify-between pb-32">
        <p className="text-center text-5xl text-balance">Legal, privacy and terms</p>

        <ul className="mt-8 flex flex-wrap items-center gap-8 text-sm max-sm:mt-16 max-sm:flex-col">
          <li>
            <ActivePrivacyLink href="/privacy">Privacy Policy</ActivePrivacyLink>
          </li>
          <li>
            <ActivePrivacyLink href="/terms">Terms of Service</ActivePrivacyLink>
          </li>
          <li>
            <ActivePrivacyLink href="/cookies">Cookies Policy</ActivePrivacyLink>
          </li>
          <li>
            <ActivePrivacyLink href="/acceptable-use">Acceptable Use Policy</ActivePrivacyLink>
          </li>
        </ul>
      </header>

      {props.children}
    </SimpleLayout>
  );
}
