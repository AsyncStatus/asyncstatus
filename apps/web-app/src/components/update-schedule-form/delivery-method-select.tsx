import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import { listSlackChannelsContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { SiSlack } from "@asyncstatus/ui/brand-icons";
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
import { BuildingIcon, Check, ChevronsUpDown, UsersIcon, XIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getInitials } from "@/lib/utils";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";
import { FormControl } from "../form";

export type DeliveryMethodSelectProps = {
  organizationSlug: string;
  type: "everyone" | "member" | "slack" | "team" | undefined;
  value: string | undefined;
  onSelect: (
    type: "everyone" | "member" | "slack" | "team" | undefined,
    value: string | undefined,
  ) => void;
};

export function DeliveryMethodSelect(props: DeliveryMethodSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const members = useQuery(
    typedQueryOptions(listMembersContract, { idOrSlug: props.organizationSlug }),
  );
  const slackChannels = useQuery(
    typedQueryOptions(listSlackChannelsContract, { idOrSlug: props.organizationSlug }),
  );
  const teams = useQuery(
    typedQueryOptions(listTeamsContract, { idOrSlug: props.organizationSlug }),
  );

  const selectedEveryone = useMemo(() => {
    return props.type === "everyone" && props.value === undefined;
  }, [props.type, props.value]);

  const selectedMember = useMemo(() => {
    return (
      props.type === "member" && members.data?.members.find((member) => member.id === props.value)
    );
  }, [props.type, props.value, members.data]);

  const selectedTeam = useMemo(() => {
    return props.type === "team" && teams.data?.find((team) => team.id === props.value);
  }, [props.type, props.value, teams.data]);

  const selectedSlackChannel = useMemo(() => {
    return (
      props.type === "slack" &&
      slackChannels.data?.find((channel) => channel.channelId === props.value)
    );
  }, [props.type, props.value, slackChannels.data]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          {/** biome-ignore lint/a11y/useSemanticElements: it's fine to use a button as a combobox */}
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn("justify-between", !props.type && "text-muted-foreground")}
          >
            <div className="flex items-center gap-2">
              {!props.type && "Select delivery method"}
              {selectedEveryone && (
                <>
                  <BuildingIcon className="size-4" />
                  <span>Everyone's email</span>
                </>
              )}
              {selectedMember && (
                <>
                  <Avatar className="size-4">
                    <AvatarImage
                      src={typedUrl(getFileContract, {
                        idOrSlug: props.organizationSlug,
                        fileKey: selectedMember.user.image ?? "",
                      })}
                    />
                    <AvatarFallback className="text-[0.65rem]">
                      {getInitials(selectedMember.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedMember.user.email}</span>
                </>
              )}
              {selectedTeam && (
                <>
                  <UsersIcon className="size-4" />
                  <span>{selectedTeam.name}</span>
                </>
              )}
              {selectedSlackChannel && (
                <>
                  <SiSlack className="size-4" />
                  <span>{selectedSlackChannel.name}</span>
                </>
              )}

              {props.type && (
                // biome-ignore lint/a11y/useSemanticElements: it's fine to use a div as a button here
                <div
                  className="p-2 ml-2"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      props.onSelect(undefined, undefined);
                    }
                  }}
                  onClick={() => props.onSelect(undefined, undefined)}
                >
                  <XIcon className="size-4" />
                </div>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search delivery methods..." className="h-9" />
          <CommandList>
            <CommandEmpty>No delivery methods found.</CommandEmpty>
            <CommandItem
              value="everyone"
              onSelect={() => {
                props.onSelect("everyone", undefined);
                setIsOpen(false);
              }}
            >
              <BuildingIcon className="size-4" />
              <span>Everyone's email</span>
              <Check
                className={cn(
                  "ml-auto h-4 w-4",
                  props.type === "everyone" && props.value === undefined
                    ? "opacity-100"
                    : "opacity-0",
                )}
              />
            </CommandItem>

            <CommandGroup heading="Email">
              {members.data?.members.map((member) => {
                return (
                  <CommandItem
                    key={member.id}
                    value={member.id}
                    onSelect={() => {
                      if (props.type === "member" && props.value === member.id) {
                        props.onSelect(undefined, undefined);
                        setIsOpen(false);
                        return;
                      }

                      props.onSelect("member", member.id);
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
                        props.type === "member" && props.value === member.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandGroup heading="Teams">
              {teams.data?.length === 0 && <CommandItem disabled>No teams found</CommandItem>}

              {teams.data?.map((team) => {
                return (
                  <CommandItem
                    key={team.id}
                    value={team.id}
                    onSelect={() => {
                      if (props.type === "team" && props.value === team.id) {
                        props.onSelect(undefined, undefined);
                        setIsOpen(false);
                        return;
                      }

                      props.onSelect("team", team.id);
                      setIsOpen(false);
                    }}
                  >
                    <UsersIcon className="size-4" />
                    <span>{team.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        props.type === "team" && props.value === team.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandGroup heading="Slack channels">
              {slackChannels.data?.length === 0 && (
                <CommandItem disabled>No Slack channels found</CommandItem>
              )}

              {slackChannels.data?.map((channel) => {
                return (
                  <CommandItem
                    key={channel.channelId}
                    value={channel.channelId}
                    onSelect={() => {
                      if (props.type === "slack" && props.value === channel.channelId) {
                        props.onSelect(undefined, undefined);
                        setIsOpen(false);
                        return;
                      }

                      props.onSelect("slack", channel.channelId);
                      setIsOpen(false);
                    }}
                  >
                    <SiSlack className="size-4" />
                    <span>{channel.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        props.type === "slack" && props.value === channel.channelId
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
