"use client";

import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { Button, buttonVariants } from "@asyncstatus/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@asyncstatus/ui/components/navigation-menu";
import { ArrowRightIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { Navbar } from "./navbar-menu";

const MotionLink = motion.create(Link);

export function Header() {
  const { scrollY } = useScroll();
  const headerBackgroundColor = useTransform(
    scrollY,
    [-100, 0, 70],
    ["#ffffff00", "#ffffff00", "#eeeeeee0"],
  );
  const borderOpacity = useTransform(
    scrollY,
    [-100, 0, 70],
    ["#ffffff00", "#ffffff00", "#EBEBEBff"],
  );
  const linesOpacity = useTransform(scrollY, [-100, 0, 45], [1, 1, 0]);
  const createAccountButtonBackgroundColor = useTransform(
    scrollY,
    [-100, 535, 540],
    ["#ffffff", "#ffffff", "#0D54D9"],
  );
  const createAccountButtonTextColor = useTransform(
    scrollY,
    [-100, 535, 540],
    ["#000000", "#000000", "#ffffff"],
  );

  return (
    <header className="sticky top-2 z-50">
      <motion.div
        className="absolute -top-px left-0 right-0 h-px bg-neutral-300"
        style={{ opacity: linesOpacity }}
      ></motion.div>
      <motion.div
        className="absolute -bottom-px left-0 right-0 h-px bg-neutral-300"
        style={{ opacity: linesOpacity }}
      ></motion.div>

      <motion.div
        className="relative flex items-center justify-between p-2 px-3.5 max-w-6xl mt-6.5 mx-auto w-full rounded-2xl backdrop-blur-sm border border-border"
        style={{ backgroundColor: headerBackgroundColor, borderColor: borderOpacity }}
      >
        <motion.div
          className="absolute -left-px -top-6.5 -bottom-px w-px bg-neutral-300"
          style={{ opacity: linesOpacity }}
        ></motion.div>
        <motion.div
          className="absolute -right-px -top-6.5 -bottom-px w-px bg-neutral-300"
          style={{ opacity: linesOpacity }}
        ></motion.div>

        <div className="flex items-center justify-between w-full h-9">
          <div className="flex flex-col">
            <Link href="/" className="flex items-center gap-1 w-fit">
              <AsyncStatusLogo className="h-3.5 w-auto" />
              <h1 className="text-lg font-medium max-sm:text-base">AsyncStatus</h1>
            </Link>
          </div>

          <Navbar />

          <div className="flex items-center">
            <Button size="sm" asChild variant="ghost">
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/login`}>
                <span>Login</span>
              </Link>
            </Button>

            <MotionLink
              href={`${process.env.NEXT_PUBLIC_APP_URL}/sign-up`}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline", className: "gap-0.5 group" }),
              )}
              style={{
                backgroundColor: createAccountButtonBackgroundColor,
                color: createAccountButtonTextColor,
              }}
            >
              <span>Get started</span>
              <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </MotionLink>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
