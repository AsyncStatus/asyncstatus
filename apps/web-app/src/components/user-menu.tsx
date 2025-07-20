import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@asyncstatus/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@asyncstatus/ui/components/sidebar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { toast } from "@asyncstatus/ui/components/sonner";
import { ChevronsUpDown, CreditCard, LogOut, Settings } from "@asyncstatus/ui/icons";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { logoutMutationOptions, sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { getInitials } from "@/lib/utils";
import { typedUrl } from "@/typed-handlers";
import { ThemeToggle } from "./toggle-theme";

export function UserMenu(props: { organizationSlug: string }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSuspenseQuery(sessionBetterAuthQueryOptions());
  const logout = useMutation({
    ...logoutMutationOptions(),
    onSuccess: async () => {
      await router.invalidate();
      queryClient.clear();
      await navigate({ to: "/login", search: { redirect: undefined } });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!session.data) {
    return null;
  }

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
                      ? typedUrl(getFileContract, {
                          idOrSlug: props.organizationSlug,
                          fileKey: session.data.user.image,
                        })
                      : undefined
                  }
                  alt={session.data.user.name}
                />
                <AvatarFallback>{getInitials(session.data.user.name)}</AvatarFallback>
              </Avatar>

              <div className="grid flex-1 pt-1 text-left text-sm leading-3">
                <span className="truncate font-semibold">{session.data.user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {session.data.user.email}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="end"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8">
                  <AvatarImage
                    src={
                      session.data.user.image
                        ? typedUrl(getFileContract, {
                            idOrSlug: props.organizationSlug,
                            fileKey: session.data.user.image,
                          })
                        : undefined
                    }
                    alt={session.data.user.name}
                  />
                  <AvatarFallback>{getInitials(session.data.user.name)}</AvatarFallback>
                </Avatar>

                <div className="grid flex-1 pt-1 text-left text-sm leading-3">
                  <span className="truncate font-semibold">{session.data.user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {session.data.user.email}
                  </span>
                </div>

                <div className="ml-2">
                  <ThemeToggle />
                </div>
              </div>
            </DropdownMenuLabel>

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

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  to="/$organizationSlug/settings"
                  params={{ organizationSlug: props.organizationSlug }}
                  search={{ tab: "profile" }}
                >
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuItem onClick={() => logout.mutate()} disabled={logout.isPending}>
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
