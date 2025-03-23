import { logoutMutationOptions, sessionQueryOptions } from "@/rpc/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@asyncstatus/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@asyncstatus/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@asyncstatus/ui/components/sidebar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { ChevronsUpDown, CreditCard, LogOut } from "@asyncstatus/ui/icons";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";

import { getInitials } from "@/lib/utils";

export function UserMenu() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSuspenseQuery(sessionQueryOptions());
  const logout = useMutation({
    ...logoutMutationOptions(),
    onSuccess: async () => {
      await router.invalidate();
      queryClient.clear();
      await navigate({ to: "/login" });
    },
  });
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8">
                <AvatarImage
                  src={
                    session.data.user.image
                      ? `https://cdn.asyncstatus.com/${session.data.user.image}`
                      : undefined
                  }
                  alt={session.data.user.name}
                />
                <AvatarFallback>
                  {getInitials(session.data.user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 pt-1 text-left text-sm leading-3">
                <span className="truncate font-semibold">
                  {session.data.user.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {session.data.user.email}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={18}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8">
                  <AvatarImage
                    src={
                      session.data.user.image
                        ? `https://cdn.asyncstatus.com/${session.data.user.image}`
                        : undefined
                    }
                    alt={session.data.user.name}
                  />
                  <AvatarFallback>
                    {getInitials(session.data.user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 pt-1 text-left text-sm leading-3">
                  <span className="truncate font-semibold">
                    {session.data.user.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {session.data.user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a
                  href={import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL}
                  target="_blank"
                  rel="noreferrer"
                >
                  <CreditCard />
                  Plan and billing
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center p-1">
      <Skeleton className="size-8 rounded-full" />
      <ChevronsUpDown className="ml-auto size-4" />
    </div>
  );
}
