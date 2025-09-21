import { SiGithub } from "@asyncstatus/ui/brand-icons";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@asyncstatus/ui/components/navigation-menu";
import {
  BookOpen,
  Briefcase,
  Code2,
  FileText,
  GitCommit,
  ListChecks,
  Megaphone,
  Palette,
} from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import Link from "next/link";
import React from "react";

export function Navbar() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Use cases</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-4 p-1 pt-2 md:w-[500px] lg:w-[700px] lg:grid-cols-2">
              <div>
                <div className="px-1 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  By workflow
                </div>
                <ul className="mt-2 grid gap-3">
                  <ListItem
                    icon={ListChecks}
                    href="/use-cases/status-updates"
                    title="Status updates"
                  >
                    Turn activity from the tools you use into status updates for your team.
                  </ListItem>
                  <ListItem icon={FileText} href="/use-cases/summaries" title="Summaries">
                    Summarize any activity and get a quick overview of what's happening.
                  </ListItem>
                  <ListItem icon={Megaphone} href="/use-cases/release-notes" title="Release notes">
                    Non-technical release notes for your GitHub and GitLab repositories.
                  </ListItem>
                  <ListItem icon={GitCommit} href="/use-cases/changelogs" title="Changelogs">
                    Technical changelogs for your GitHub and GitLab repositories.
                  </ListItem>
                </ul>
              </div>

              <div>
                <div className="px-1 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  By audience
                </div>
                <ul className="mt-2 grid gap-3">
                  <ListItem icon={Code2} href="/for/engineering" title="Engineering teams">
                    Automate status updates and changelogs from GitHub, Linear, and Slack.
                  </ListItem>
                  <ListItem icon={Palette} href="/for/product-design" title="Product & Design">
                    Cross-tool summaries across Figma, Linear, and Slack to keep roadmaps moving.
                  </ListItem>
                  <ListItem icon={SiGithub} href="/for/open-source" title="Open source projects">
                    Keep contributors aligned with public changelogs and community updates.
                  </ListItem>
                  <ListItem icon={Briefcase} href="/for/agencies" title="Agencies & consultancies">
                    Client-ready updates and shareable weekly summaries with zero manual prep.
                  </ListItem>
                </ul>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Developer</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-1 md:w-[400px] lg:w-[500px]">
              <ListItem icon={Code2} href="/docs/cli" title="Quick start">
                It takes less {"<"}1min to generate and share your first local status update.
              </ListItem>
              <ListItem icon={BookOpen} href="/docs" title="Documentation">
                Reference and code examples for the AsyncStatus SDK and CLI.
              </ListItem>
              <ListItem
                href="https://github.com/asyncstatus/asyncstatus"
                target="_blank"
                title="Open source"
                icon={SiGithub}
              >
                <span className="inline-flex items-center gap-2">
                  We're open source. Check out our source code on GitHub and contribute.
                </span>
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild href="/#pricing" className={navigationMenuTriggerStyle()}>
            <Link href="/#pricing">Pricing</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

type ListItemProps = React.ComponentPropsWithoutRef<"a"> & {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ className, title, children, icon: Icon, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className,
            )}
            {...props}
          >
            <div className="flex items-center gap-1 text-base font-medium leading-none">
              {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
              <span>{title}</span>
            </div>
            <p className="line-clamp-3 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  },
);
