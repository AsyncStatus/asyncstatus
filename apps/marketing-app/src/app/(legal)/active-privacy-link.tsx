"use client";

import { PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@asyncstatus/ui/lib/utils";

export function ActivePrivacyLink(props: PropsWithChildren<{ href: string }>) {
  const pathname = usePathname();

  return (
    <Link
      href={props.href}
      className={cn({ "text-primary": pathname === props.href })}
    >
      {props.children}
    </Link>
  );
}
