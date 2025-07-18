import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import {
  listMemberOrganizationsContract,
  setActiveOrganizationContract,
} from "@asyncstatus/api/typed-handlers/organization";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@asyncstatus/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@asyncstatus/ui/components/dropdown-menu";
import { ScrollArea } from "@asyncstatus/ui/components/scroll-area";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@asyncstatus/ui/components/sidebar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { Check, ChevronsUpDown, Plus } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { getInitials } from "@/lib/utils";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { CreateOrganizationForm } from "./create-organization-form";

export function OrganizationMenu(props: { organizationSlug: string }) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSuspenseQuery(sessionBetterAuthQueryOptions());
  const organizations = useQuery({
    ...typedQueryOptions(listMemberOrganizationsContract, {}),
    select(data) {
      if (!session.data?.session.activeOrganizationSlug) {
        return data;
      }

      return data.sort(
        (a) =>
          (session.data?.session.activeOrganizationSlug === a.organization.slug ? -1 : 1) ||
          a.organization.createdAt.getTime(),
      );
    },
  });
  const setActiveOrganization = useMutation(
    typedMutationOptions(setActiveOrganizationContract, {
      onMutate(data) {
        if (!(data instanceof FormData)) {
          navigate({
            to: "/$organizationSlug",
            params: { organizationSlug: data.idOrSlug },
          });
        }
      },
      onSuccess(data) {
        queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            session: { ...sessionData.session, activeOrganizationSlug: data.slug },
          };
        });
      },
    }),
  );
  const [createOrganizationDialogOpen, setCreateOrganizationDialogOpen] = useState(false);
  const activeOrganization = useMemo(
    () => organizations.data?.find((o) => o.organization.slug === props.organizationSlug),
    [organizations.data, props.organizationSlug],
  );

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto p-1"
              >
                <Avatar className="size-8">
                  <AvatarImage
                    src={
                      activeOrganization?.organization.logo
                        ? typedUrl(getFileContract, {
                            idOrSlug: props.organizationSlug,
                            fileKey: activeOrganization.organization.logo,
                          })
                        : undefined
                    }
                    alt={activeOrganization?.organization.name}
                  />
                  <AvatarFallback>
                    {getInitials(activeOrganization?.organization.name ?? "")}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm">
                  <span className="truncate">{activeOrganization?.organization.name}</span>
                </div>

                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Organizations{organizations.data?.length > 1 && ` (${organizations.data.length})`}
              </DropdownMenuLabel>

              <ScrollArea className="h-36 w-full">
                {organizations.data?.map((organization) => {
                  const isActive =
                    session.data?.session.activeOrganizationSlug === organization.organization.slug;

                  return (
                    <DropdownMenuItem
                      asChild
                      key={organization.organization.id}
                      className="gap-2 p-2"
                    >
                      <Link
                        to="/$organizationSlug"
                        params={{ organizationSlug: organization.organization.slug }}
                        onClick={() => {
                          setActiveOrganization.mutate({
                            idOrSlug: organization.organization.slug,
                          });
                        }}
                      >
                        <Avatar className="size-8">
                          <AvatarImage
                            src={
                              organization.organization.logo
                                ? typedUrl(getFileContract, {
                                    idOrSlug: organization.organization.slug,
                                    fileKey: organization.organization.logo,
                                  })
                                : undefined
                            }
                            alt={organization.organization.name}
                          />
                          <AvatarFallback>
                            {getInitials(organization.organization.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex w-full items-center justify-between gap-2">
                          <p className="max-w-40 flex-1 truncate font-semibold">
                            {organization.organization.name}
                          </p>
                          <div className="ml-auto flex h-auto items-center">
                            {isActive && <Check className="inline-block size-4" />}
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </ScrollArea>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setCreateOrganizationDialogOpen(true)}
              >
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>

                <div className="text-muted-foreground font-medium">Create organization</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createOrganizationDialogOpen} onOpenChange={setCreateOrganizationDialogOpen}>
        <DialogContent className="gap-8">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              We will create a new organization for you and set it as the active one.
            </DialogDescription>
          </DialogHeader>

          <CreateOrganizationForm
            onSuccess={(data) => {
              setCreateOrganizationDialogOpen(false);
              navigate({
                to: "/$organizationSlug",
                params: { organizationSlug: data.organization.slug },
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OrganizationMenuSkeleton() {
  return (
    <div className="flex items-center p-1">
      <Skeleton className="size-8 rounded-full" />
      <Skeleton className="ml-2 h-6 w-26 rounded-md" />
      <ChevronsUpDown className="ml-auto size-4" />
    </div>
  );
}
