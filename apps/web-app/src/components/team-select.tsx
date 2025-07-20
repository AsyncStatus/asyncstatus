import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
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
import { typedQueryOptions } from "@/typed-handlers";

export function TeamSelect({
  organizationSlug,
  value,
  onSelect,
  id,
  placeholder = "Filter by team",
}: {
  organizationSlug: string;
  value: string | undefined;
  onSelect: (value: string | undefined) => void;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const teams = useQuery(typedQueryOptions(listTeamsContract, { idOrSlug: organizationSlug }));

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
            {teams.data?.find((team) => team.id === value)?.name ?? placeholder}
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
          <CommandInput placeholder="Search team..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {teams.data?.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.id}
                  onSelect={(currentValue) => {
                    onSelect(currentValue);
                    setOpen(false);
                  }}
                >
                  {team.name}
                  <Check
                    className={cn("ml-auto", value === team.id ? "opacity-100" : "opacity-0")}
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
