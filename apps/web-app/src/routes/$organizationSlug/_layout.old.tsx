import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleHelpIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GenerateStatusButton } from "@/components/generate-status-button";
import { typedQueryOptions } from "@/typed-handlers";
import { EmptyState } from "../../components/empty-state";
import { StatusUpdateCard } from "../../components/status-update-card";
import { rpc } from "../../rpc/rpc";

export const Route = createFileRoute("/$organizationSlug/_layout/old")({
  component: RouteComponent,
});

const filterOptions = {
  all: "All updates",
  mine: "My updates",
  team: "Team updates",
};

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const organizationQuery = useQuery(
    typedQueryOptions(getOrganizationContract, {
      idOrSlug: organizationSlug,
    }),
  );
  const organization = organizationQuery.data?.organization;
  const member = organizationQuery.data?.member;

  const [filter, setFilter] = useState("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: statusUpdates } = useQuery({
    queryKey: ["statusUpdates", organization?.id, filter, selectedTeamId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let result: any;
      if (filter === "mine" && member) {
        result = await rpc.organization[":idOrSlug"]["status-update"].member[":memberId"].$get({
          param: { memberId: member.id, idOrSlug: organizationSlug },
          query: {},
        });
      } else if (filter === "team" && selectedTeamId) {
        result = await rpc.organization[":idOrSlug"]["status-update"].team[":teamId"].$get({
          param: { teamId: selectedTeamId, idOrSlug: organizationSlug },
        });
      } else {
        result = await rpc.organization[":idOrSlug"]["status-update"].$get({
          param: { idOrSlug: organizationSlug },
        });
      }

      if (!result.ok) {
        throw await result.json();
      }

      return result.json();
    },
    enabled: !!organization?.id,
  });

  // Fetch teams for team filter
  const { data: teams } = useQuery({
    queryKey: ["teams", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const response = await rpc.organization[":idOrSlug"].teams.$get({
        param: { idOrSlug: organization.id },
      });

      if (!response.ok) {
        throw await response.json();
      }

      return response.json();
    },
    enabled: !!organization?.id,
  });

  // Handle creating public share links
  const createShareMutation = useMutation({
    mutationFn: async (statusUpdateId: string) => {
      const response = await rpc.organization[":idOrSlug"]["public-share"].$post({
        param: { idOrSlug: organizationSlug },
        json: {
          statusUpdateId,
          isActive: true,
        },
      });

      if (!response.ok) {
        throw await response.json();
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Copy the share link to clipboard
      const shareUrl = `${window.location.origin}/s/${data.slug}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard");
    },
    onError: () => {
      toast.error("Failed to create share link");
    },
  });

  const handleShare = (statusUpdateId: string) => {
    createShareMutation.mutate(statusUpdateId);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    if (value !== "team") {
      setSelectedTeamId(null);
    }
  };

  return (
    <>
      <header className="flex flex-col gap-4 pb-4">
        <div className="flex items-center gap-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Status updates</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Mobile-optimized controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(filterOptions).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filter === "team" && teams && (
              <Select value={selectedTeamId || ""} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team: any) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <GenerateStatusButton organizationSlug={organizationSlug} memberId={member?.id ?? ""} />
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link
                to="/$organizationSlug/status-update"
                params={{ organizationSlug }}
                className="flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="sm:inline">New status update</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 pt-0">
        {(statusUpdates?.length ?? 0) > 0 ? (
          <div className="grid auto-rows-min gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {statusUpdates?.map((statusUpdate: any) => (
              <StatusUpdateCard
                key={statusUpdate.id}
                organizationSlug={organizationSlug}
                statusUpdate={statusUpdate}
                onShare={!statusUpdate.isDraft ? handleShare : undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CircleHelpIcon className="h-10 w-10" />}
            title="No status updates yet"
            description="Create your first status update to share with your team."
            action={
              <Button asChild>
                <Link
                  to="/$organizationSlug/status-update"
                  params={{ organizationSlug }}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  New status update
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}
