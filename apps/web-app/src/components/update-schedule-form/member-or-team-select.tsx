import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@asyncstatus/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@asyncstatus/ui/components/popover";
import {
  BuildingIcon,
  Check,
  ChevronsUpDown,
  UserIcon,
  UsersIcon,
  XIcon,
} from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getInitials } from "@/lib/utils";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";

export function MemberOrTeamSelect({
  size = "sm",
  allowEveryone,
  organizationSlug,
  type,
  value,
  onSelect,
  id,
  placeholder,
}: {
  size?: "sm" | "default";
  allowEveryone?: boolean;
  organizationSlug: string;
  type: "everyone" | "member" | "team" | undefined;
  value: string | undefined;
  onSelect: (type: "everyone" | "member" | "team" | undefined, value: string | undefined) => void;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const members = useQuery(typedQueryOptions(listMembersContract, { idOrSlug: organizationSlug }));
  const teams = useQuery(typedQueryOptions(listTeamsContract, { idOrSlug: organizationSlug }));

  const selectedEveryone = useMemo(() => {
    return type === "everyone";
  }, [type]);

  const selectedMember = useMemo(() => {
    return type === "member"
      ? members.data?.members.find((member) => member.id === value)
      : undefined;
  }, [members.data, value, type]);

  const selectedTeam = useMemo(() => {
    return type === "team" ? teams.data?.find((team) => team.id === value) : undefined;
  }, [teams.data, value, type]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/** biome-ignore lint/a11y/useSemanticElements: it's fine */}
        <Button
          id={id}
          size={size}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", !type && "text-muted-foreground")}
        >
          <div className="flex items-center gap-2">
            {!type && (placeholder ?? "Select member or team")}
            {selectedEveryone && (
              <>
                <BuildingIcon className="size-4" />
                <span>Everyone</span>
              </>
            )}
            {selectedMember && (
              <>
                <Avatar className="size-4">
                  <AvatarImage
                    src={typedUrl(getFileContract, {
                      idOrSlug: organizationSlug,
                      // biome-ignore lint/style/noNonNullAssertion: It's fine, nulls are handled by avatar fallback
                      fileKey: selectedMember.user.image!,
                    })}
                  />
                  <AvatarFallback className="text-[0.65rem]">
                    {getInitials(selectedMember.user.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedMember.user.name}</span>
              </>
            )}
            {selectedTeam && (
              <>
                <UsersIcon className="size-4" />
                <span>{selectedTeam.name}</span>
              </>
            )}
            {type && (
              // biome-ignore lint/a11y/useSemanticElements: it's fine to use a div as a button here
              <div
                className="p-2 ml-2"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelect(undefined, undefined);
                  }
                }}
                onClick={() => onSelect(undefined, undefined)}
              >
                <XIcon className="size-4" />
              </div>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search user..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {allowEveryone && (
              <CommandItem
                value="everyone"
                onSelect={() => {
                  onSelect("everyone", undefined);
                  setOpen(false);
                }}
              >
                <UserIcon className="size-4 m-2" />
                <span>Everyone</span>
                <Check
                  className={cn("ml-auto", value === "everyone" ? "opacity-100" : "opacity-0")}
                />
              </CommandItem>
            )}

            <CommandGroup>
              {members.data?.members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.id}
                  onSelect={(currentValue) => {
                    onSelect("member", currentValue);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarImage
                        src={typedUrl(getFileContract, {
                          idOrSlug: organizationSlug,
                          // biome-ignore lint/style/noNonNullAssertion: It's fine, nulls are handled by avatar fallback
                          fileKey: member.user.image!,
                        })}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {member.user.name}
                  </div>
                  <Check
                    className={cn("ml-auto", value === member.id ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
