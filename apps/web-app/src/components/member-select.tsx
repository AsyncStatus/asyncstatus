import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
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
import { Check, ChevronsUpDown, XIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getInitials } from "@/lib/utils";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";

export function MemberSelect({
  organizationSlug,
  value,
  onSelect,
  id,
  placeholder,
}: {
  organizationSlug: string;
  value: string | undefined;
  onSelect: (value: string | undefined) => void;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const members = useQuery(typedQueryOptions(listMembersContract, { idOrSlug: organizationSlug }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/** biome-ignore lint/a11y/useSemanticElements: it's fine */}
        <Button
          id={id}
          size="sm"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", !value && "text-muted-foreground")}
        >
          <div className="flex items-center gap-2">
            {members.data?.members.find((member) => member.id === value)?.user.name ??
              placeholder ??
              "Filter by user"}
            {value && (
              <Button size="icon" variant="ghost" onClick={() => onSelect(undefined)}>
                <XIcon className="size-4" />
              </Button>
            )}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search user..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup>
              {members.data?.members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.id}
                  onSelect={(currentValue) => {
                    onSelect(currentValue);
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
