import { listDiscordChannelsContract } from "@asyncstatus/api/typed-handlers/discord-integration";
import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import type { ScheduleConfigDeliveryMethod } from "@asyncstatus/api/typed-handlers/schedule";
import { listSlackChannelsContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { SiDiscord, SiSlack } from "@asyncstatus/ui/brand-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { Badge } from "@asyncstatus/ui/components/badge";
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
import { BuildingIcon, Check, ChevronsUpDown, UsersIcon, XIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getInitials } from "@/lib/utils";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";
import { FormControl } from "../form";

export type DeliveryMethodsSelectProps = {
  organizationSlug: string;
  values: ScheduleConfigDeliveryMethod[];
  onSelect: (values: ScheduleConfigDeliveryMethod[]) => void;
  placeholder?: string;
};

export function DeliveryMethodsSelect(props: DeliveryMethodsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const members = useQuery(
    typedQueryOptions(listMembersContract, { idOrSlug: props.organizationSlug }),
  );
  const slackChannels = useQuery(
    typedQueryOptions(listSlackChannelsContract, { idOrSlug: props.organizationSlug }),
  );
  const teams = useQuery(
    typedQueryOptions(listTeamsContract, { idOrSlug: props.organizationSlug }),
  );
  const discordChannels = useQuery(
    typedQueryOptions(listDiscordChannelsContract, { idOrSlug: props.organizationSlug }),
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          {/** biome-ignore lint/a11y/useSemanticElements: it's fine to use a button as a combobox */}
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              "justify-between transition-none",
              props.values.length > 0 && "max-h-auto h-auto p-1",
              (!props.values?.length || props.values.length === 0) &&
                "text-muted-foreground py-2 h-9",
            )}
          >
            <div className="flex items-center gap-2">
              {(!props.values.length || props.values.length === 0) &&
                (props.placeholder ?? "Select delivery method")}

              {props.values.map((value) => {
                if (value.type === "organization") {
                  return (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 text-[0.65rem]"
                      key={value.value}
                    >
                      <BuildingIcon className="size-4 m-1" />
                      <span>Everyone's emails</span>
                      {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                      <div
                        className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            props.onSelect(props.values.filter((v) => v.value !== value.value));
                          }
                        }}
                        onClick={() => {
                          props.onSelect(props.values.filter((v) => v.value !== value.value));
                        }}
                      >
                        <XIcon className="size-3" />
                      </div>
                    </Badge>
                  );
                }

                if (value.type === "member") {
                  const member = members.data?.members.find((member) => member.id === value.value);
                  if (!member) {
                    return null;
                  }

                  return (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 text-[0.65rem]"
                      key={value.value}
                    >
                      <Avatar className="size-4">
                        <AvatarImage
                          src={typedUrl(getFileContract, {
                            idOrSlug: props.organizationSlug,
                            fileKey: member.user.image ?? "",
                          })}
                        />
                        <AvatarFallback className="text-[0.65rem]">
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.user.email}</span>
                      {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                      <div
                        className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            props.onSelect(props.values.filter((v) => v.value !== value.value));
                          }
                        }}
                        onClick={() => {
                          props.onSelect(props.values.filter((v) => v.value !== value.value));
                        }}
                      >
                        <XIcon className="size-3" />
                      </div>
                    </Badge>
                  );
                }

                if (value.type === "team") {
                  const team = teams.data?.find((team) => team.id === value.value);
                  if (!team) {
                    return null;
                  }

                  return (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 text-[0.65rem]"
                      key={value.value}
                    >
                      <UsersIcon className="size-4" />
                      <span>{team.name}'s emails</span>
                      {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                      <div
                        className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            props.onSelect(props.values.filter((v) => v.value !== value.value));
                          }
                        }}
                        onClick={() => {
                          props.onSelect(props.values.filter((v) => v.value !== value.value));
                        }}
                      >
                        <XIcon className="size-3" />
                      </div>
                    </Badge>
                  );
                }

                if (value.type === "customEmail") {
                  return (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 text-[0.65rem]"
                      key={value.value}
                    >
                      <span>{value.value}</span>
                      {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                      <div
                        className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            props.onSelect(props.values.filter((v) => v.value !== value.value));
                          }
                        }}
                        onClick={() => {
                          props.onSelect(props.values.filter((v) => v.value !== value.value));
                        }}
                      >
                        <XIcon className="size-3" />
                      </div>
                    </Badge>
                  );
                }

                if (value.type === "slackChannel") {
                  const channel = slackChannels.data?.find((channel) => channel.id === value.value);
                  if (!channel) {
                    return null;
                  }

                  return (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 text-[0.65rem]"
                      key={value.value}
                    >
                      <SiSlack className="size-4" />
                      <span>{channel.name}</span>
                      {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                      <div
                        className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            props.onSelect(props.values.filter((v) => v.value !== value.value));
                          }
                        }}
                        onClick={() => {
                          props.onSelect(props.values.filter((v) => v.value !== value.value));
                        }}
                      >
                        <XIcon className="size-3" />
                      </div>
                    </Badge>
                  );
                }

                if (value.type === "discordChannel") {
                  const channel = discordChannels.data?.find(
                    (channel) => channel.id === value.value,
                  );
                  if (!channel) {
                    return null;
                  }

                  return (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 text-[0.65rem]"
                      key={value.value}
                    >
                      <SiDiscord className="size-4" />
                      <span>{channel.name}</span>
                      {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                      <div
                        className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            props.onSelect(props.values.filter((v) => v.value !== value.value));
                          }
                        }}
                        onClick={() => {
                          props.onSelect(props.values.filter((v) => v.value !== value.value));
                        }}
                      >
                        <XIcon className="size-3" />
                      </div>
                    </Badge>
                  );
                }

                return null;
              })}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search delivery methods..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No delivery methods found.</CommandEmpty>
            {search && (
              <CommandGroup heading="Search results">
                <CommandItem
                  value={search}
                  onSelect={() => {
                    if (props.values.find((v) => v.type === "customEmail" && v.value === search)) {
                      props.onSelect(props.values.filter((v) => v.value !== search));
                    } else {
                      props.onSelect([...props.values, { type: "customEmail", value: search }]);
                    }
                    setIsOpen(false);
                  }}
                >
                  Add {search} email
                </CommandItem>
              </CommandGroup>
            )}

            <CommandItem
              value="everyone"
              onSelect={() => {
                if (
                  props.values.find(
                    (v) => v.type === "organization" && v.value === props.organizationSlug,
                  )
                ) {
                  props.onSelect(props.values.filter((v) => v.value !== props.organizationSlug));
                } else {
                  props.onSelect([{ type: "organization", value: props.organizationSlug }]);
                }
                setIsOpen(false);
              }}
            >
              <BuildingIcon className="size-4" />
              <span>Everyone's email</span>
              <Check
                className={cn(
                  "ml-auto h-4 w-4",
                  props.values.find(
                    (v) => v.type === "organization" && v.value === props.organizationSlug,
                  )
                    ? "opacity-100"
                    : "opacity-0",
                )}
              />
            </CommandItem>

            <CommandGroup heading="User's email">
              {members.data?.members.map((member) => {
                return (
                  <CommandItem
                    key={member.id}
                    value={member.id}
                    onSelect={() => {
                      if (props.values.find((v) => v.type === "member" && v.value === member.id)) {
                        props.onSelect(props.values.filter((v) => v.value !== member.id));
                        setIsOpen(false);
                        return;
                      }

                      props.onSelect([...props.values, { type: "member", value: member.id }]);
                      setIsOpen(false);
                    }}
                  >
                    <Avatar className="size-4">
                      <AvatarImage
                        src={typedUrl(getFileContract, {
                          idOrSlug: props.organizationSlug,
                          fileKey: member.user.image ?? "",
                        })}
                      />
                      <AvatarFallback className="text-[0.65rem]">
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.user.email}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        props.values.find((v) => v.type === "member" && v.value === member.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandGroup heading="Team's email">
              {teams.data?.length === 0 && <CommandItem disabled>No teams found</CommandItem>}

              {teams.data?.map((team) => {
                return (
                  <CommandItem
                    key={team.id}
                    value={team.id}
                    onSelect={() => {
                      if (props.values.find((v) => v.type === "team" && v.value === team.id)) {
                        props.onSelect(props.values.filter((v) => v.value !== team.id));
                        setIsOpen(false);
                        return;
                      }

                      props.onSelect([...props.values, { type: "team", value: team.id }]);
                      setIsOpen(false);
                    }}
                  >
                    <UsersIcon className="size-4" />
                    <span>{team.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        props.values.find((v) => v.type === "team" && v.value === team.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {slackChannels.data?.length > 0 && (
              <CommandGroup heading="Slack channels">
                {slackChannels.data?.map((channel) => {
                  return (
                    <CommandItem
                      key={channel.id}
                      value={channel.id}
                      onSelect={() => {
                        if (
                          props.values.find(
                            (v) => v.type === "slackChannel" && v.value === channel.id,
                          )
                        ) {
                          props.onSelect(props.values.filter((v) => v.value !== channel.id));
                          setIsOpen(false);
                          return;
                        }

                        props.onSelect([
                          ...props.values,
                          { type: "slackChannel", value: channel.id },
                        ]);
                        setIsOpen(false);
                      }}
                    >
                      <SiSlack className="size-4" />
                      <span>{channel.name}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          props.values.find(
                            (v) => v.type === "slackChannel" && v.value === channel.id,
                          )
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {discordChannels.data?.length > 0 && (
              <CommandGroup heading="Discord channels">
                {discordChannels.data?.map((channel) => {
                  return (
                    <CommandItem
                      key={channel.id}
                      value={channel.id}
                      onSelect={() => {
                        if (
                          props.values.find(
                            (v) => v.type === "discordChannel" && v.value === channel.id,
                          )
                        ) {
                          props.onSelect(props.values.filter((v) => v.value !== channel.id));
                          setIsOpen(false);
                          return;
                        }

                        props.onSelect([
                          ...props.values,
                          { type: "discordChannel", value: channel.id },
                        ]);
                        setIsOpen(false);
                      }}
                    >
                      <SiDiscord className="size-4" />
                      <span>{channel.name}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          props.values.find(
                            (v) => v.type === "discordChannel" && v.value === channel.id,
                          )
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
