"use client";

import { cn } from "@asyncstatus/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

export function ActivePrivacyLink(props: PropsWithChildren<{ href: string }>) {
  const pathname = usePathname();

  return (
    <Link href={props.href} className={cn({ "text-primary": pathname === props.href })}>
      {props.children}
    </Link>
  );
}
