import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@asyncstatus/ui/components/avatar";
import { Badge } from "@asyncstatus/ui/components/badge";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@asyncstatus/ui/components/tooltip";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import dayjs from "dayjs";
import { ShareIcon } from "lucide-react";
import { toast } from "sonner";

import { getFileUrl } from "@/lib/utils";

type StatusUpdateItem = {
  id: string;
  content: string;
  isBlocker: boolean;
  order: number;
};

type StatusUpdateCardProps = {
  organizationSlug: string;
  statusUpdate: {
    id: string;
    effectiveFrom: string;
    effectiveTo: string;
    emoji?: string;
    mood?: string;
    isDraft: boolean;
    timezone?: string;
    member: {
      id: string;
      user: {
        name: string;
        email: string;
        image?: string;
      };
    };
    team?: {
      id: string;
      name: string;
    };
    items: StatusUpdateItem[];
  };
  onShare?: (id: string) => void;
};

export function StatusUpdateCard({
  organizationSlug,
  statusUpdate,
  onShare,
}: StatusUpdateCardProps) {
  const effectiveFrom = new Date(statusUpdate.effectiveFrom);
  const effectiveTo = new Date(statusUpdate.effectiveTo);

  // Sort items by order
  const sortedItems = [...statusUpdate.items].sort((a, b) => a.order - b.order);
  const blockerItems = sortedItems.filter((item) => item.isBlocker);
  const nonBlockerItems = sortedItems.filter((item) => !item.isBlocker);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  statusUpdate.member.user.image
                    ? getFileUrl({
                        param: { idOrSlug: organizationSlug },
                        query: { fileKey: statusUpdate.member.user.image },
                      })
                    : undefined
                }
                alt={statusUpdate.member.user?.name}
              />
              <AvatarFallback>
                {statusUpdate.member.user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {statusUpdate.member.user?.name}
              </CardTitle>
              {statusUpdate.team && (
                <CardDescription className="text-xs">
                  {statusUpdate.team.name}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusUpdate.emoji && (
              <span className="text-xl" role="img" aria-label="mood">
                {statusUpdate.emoji}
              </span>
            )}
            {statusUpdate.isDraft && <Badge variant="outline">Draft</Badge>}
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CardDescription className="pt-2 cursor-help">
                {format(effectiveFrom, "MMM d")} -{" "}
                {format(effectiveTo, "MMM d, yyyy")}
              </CardDescription>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">
                  Created in timezone: {statusUpdate.timezone || "UTC"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Original: {effectiveFrom.toISOString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="space-y-4">
        {blockerItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-destructive text-sm font-semibold">Blockers</h4>
            <ul className="space-y-2">
              {blockerItems.map((item) => (
                <li
                  key={item.id}
                  className="border-destructive border-l-2 py-1 pl-3 text-sm"
                >
                  {item.content}
                </li>
              ))}
            </ul>
          </div>
        )}

        {nonBlockerItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Updates</h4>
            <ul className="space-y-2">
              {nonBlockerItems.map((item) => (
                <li
                  key={item.id}
                  className="border-primary border-l-2 py-1 pl-3 text-sm"
                >
                  {item.content}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sortedItems.length === 0 && (
          <p className="text-muted-foreground text-sm italic">
            No updates provided
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Link
                to="/$organizationSlug/status-update/$statusUpdateId"
                params={{
                  organizationSlug,
                  statusUpdateId: statusUpdate.isDraft
                    ? dayjs(statusUpdate.effectiveFrom)
                        .startOf("day")
                        .format("YYYY-MM-DD")
                    : statusUpdate.id,
                }}
              >
                {statusUpdate.isDraft ? "Edit" : "View"}
              </Link>
            </Button>
            {!statusUpdate.isDraft && onShare && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => onShare(statusUpdate.id)}
              >
                <ShareIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
