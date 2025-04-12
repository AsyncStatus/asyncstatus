import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@asyncstatus/ui/components/avatar";
import { Badge } from "@asyncstatus/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import { Separator } from "@asyncstatus/ui/components/separator";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  BuildingIcon,
  CalendarIcon,
  CircleUserIcon,
  ClockIcon,
  Loader2Icon,
} from "lucide-react";

import { rpc } from "../rpc/rpc";

// Define the response type structure
interface SharedStatusResponse {
  statusUpdate: {
    id: string;
    mood?: string;
    emoji?: string;
    effectiveFrom: string;
    effectiveTo: string;
    items: Array<{
      id: string;
      content: string;
      isBlocker: boolean;
      order: number;
    }>;
    member: {
      name: string;
      image: string | null;
    };
    team: {
      name: string;
    } | null;
  };
  organization: {
    name: string;
    logo: string | null;
  };
  share: {
    createdAt: string;
    expiresAt: string | null;
  };
}

export const Route = createFileRoute("/s/$statusSlug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { statusSlug } = Route.useParams();

  const { data, isLoading, isError, error } = useQuery<SharedStatusResponse>({
    queryKey: ["sharedStatus", statusSlug],
    queryFn: async () => {
      const response = await rpc["public-status-share"].status[":slug"].$get({
        param: { slug: statusSlug },
      });

      if (!response.ok) {
        throw await response.json();
      }

      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Status update not found</h1>
        <p className="text-gray-500">
          This shared status might have expired or been removed.
        </p>
      </div>
    );
  }

  const { statusUpdate, organization, share } = data;
  const effectiveFrom = new Date(statusUpdate.effectiveFrom);
  const effectiveTo = new Date(statusUpdate.effectiveTo);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col p-4">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="h-6 w-6 rounded-sm"
              />
            ) : (
              <BuildingIcon className="h-6 w-6 text-gray-400" />
            )}
            <span className="font-medium">{organization.name}</span>
          </div>
          <div className="text-sm text-gray-500">
            Shared on {format(new Date(share.createdAt), "MMMM dd, yyyy")}
            {share.expiresAt && (
              <span>
                {" "}
                · Expires on{" "}
                {format(new Date(share.expiresAt), "MMMM dd, yyyy")}
              </span>
            )}
          </div>
        </div>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {statusUpdate.emoji && (
                  <span className="text-2xl">{statusUpdate.emoji}</span>
                )}
                <span>Status Update</span>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <ClockIcon className="h-3 w-3" />
                <span>
                  {format(effectiveFrom, "MMM dd")} -{" "}
                  {format(effectiveTo, "MMM dd, yyyy")}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={statusUpdate.member.image || undefined} />
                <AvatarFallback>
                  <CircleUserIcon className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{statusUpdate.member.name}</div>
                {statusUpdate.team && (
                  <div className="text-xs text-gray-500">
                    {statusUpdate.team.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {statusUpdate.items && statusUpdate.items.length > 0 ? (
              <div className="space-y-3">
                {statusUpdate.items.map((item: any) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      {item.isBlocker ? (
                        <Badge variant="destructive" className="mt-0.5">
                          Blocker
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-0.5">
                          Update
                        </Badge>
                      )}
                      <div className="flex-1">
                        <div className="whitespace-pre-wrap">
                          {item.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No update items provided
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <div className="w-full text-sm text-gray-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                <span>
                  Valid from {format(effectiveFrom, "MMM dd")} to{" "}
                  {format(effectiveTo, "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      <footer className="mt-auto pt-8">
        <Separator className="mb-4" />
        <div className="text-center text-sm text-gray-500">
          <p>Powered by AsyncStatus</p>
        </div>
      </footer>
    </div>
  );
}
