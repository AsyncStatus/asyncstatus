import { useMemo, useState } from "react";
import { sessionQueryOptions } from "@/rpc/auth";
import {
  listOrganizationsQueryOptions,
  setActiveOrganizationMutationOptions,
} from "@/rpc/organization";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@asyncstatus/ui/components/avatar";
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
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { getInitials } from "@/lib/utils";

import { CreateOrganizationForm } from "./create-organization-form";

export function OrganizationMenu(props: { organizationSlug: string }) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSuspenseQuery(sessionQueryOptions());
  const organizations = useSuspenseQuery({
    ...listOrganizationsQueryOptions(),
    select(data) {
      if (!session.data?.session.activeOrganizationId) {
        return data;
      }

      return data.sort((a) =>
        session.data?.session.activeOrganizationId === a.id ? -1 : 1,
      );
    },
  });
  const setActiveOrganization = useMutation({
    ...setActiveOrganizationMutationOptions(),
    onMutate(data) {
      if (data?.organizationSlug) {
        navigate({
          to: "/$organizationSlug",
          params: { organizationSlug: data.organizationSlug },
        });
      }
    },
    onSuccess(data) {
      queryClient.setQueryData(
        sessionQueryOptions().queryKey,
        (sessionData) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            session: { ...sessionData.session, activeOrganizationId: data.id },
          };
        },
      );
    },
  });
  const [createOrganizationDialogOpen, setCreateOrganizationDialogOpen] =
    useState(false);
  const activeOrganization = useMemo(
    () => organizations.data?.find((o) => o.slug === props.organizationSlug),
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
                  <AvatarImage src={undefined} alt={activeOrganization?.name} />
                  <AvatarFallback>
                    {getInitials(activeOrganization?.name ?? "")}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm">
                  <span className="truncate">{activeOrganization?.name}</span>
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
                Organizations
              </DropdownMenuLabel>

              <ScrollArea className="h-36 w-full">
                {organizations.data?.map((organization) => {
                  const isActive =
                    session.data?.session.activeOrganizationId ===
                    organization.id;

                  return (
                    <DropdownMenuItem
                      asChild
                      key={organization.id}
                      className="gap-2 p-2"
                    >
                      <Link
                        to="/$organizationSlug"
                        params={{ organizationSlug: organization.slug }}
                        onClick={() => {
                          setActiveOrganization.mutate({
                            organizationSlug: organization.slug,
                          });
                        }}
                      >
                        <Avatar className="size-8">
                          <AvatarImage
                            src={undefined}
                            alt={organization.name}
                          />
                          <AvatarFallback>
                            {getInitials(organization.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex w-full items-center justify-between gap-2">
                          <p className="max-w-40 flex-1 truncate font-semibold">
                            {organization.name}
                          </p>
                          <div className="ml-auto flex h-auto items-center">
                            {isActive && (
                              <Check className="inline-block size-4" />
                            )}
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

                <div className="text-muted-foreground font-medium">
                  Create organization
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog
        open={createOrganizationDialogOpen}
        onOpenChange={setCreateOrganizationDialogOpen}
      >
        <DialogContent className="gap-8">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              We will create a new organization for you and set it as the active
              one.
            </DialogDescription>
          </DialogHeader>

          <CreateOrganizationForm
            onSuccess={(data) => {
              setCreateOrganizationDialogOpen(false);
              navigate({
                to: "/$organizationSlug",
                params: { organizationSlug: data.slug },
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
