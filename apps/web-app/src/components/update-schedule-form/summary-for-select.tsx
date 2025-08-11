import {
  getDiscordIntegrationContract,
  listDiscordChannelsContract,
} from "@asyncstatus/api/typed-handlers/discord-integration";
import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import {
  getGithubIntegrationContract,
  listGithubRepositoriesContract,
} from "@asyncstatus/api/typed-handlers/github-integration";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import type { ScheduleConfigSummaryFor } from "@asyncstatus/api/typed-handlers/schedule";
import {
  getSlackIntegrationContract,
  listSlackChannelsContract,
} from "@asyncstatus/api/typed-handlers/slack-integration";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { SiDiscord, SiGithub, SiSlack } from "@asyncstatus/ui/brand-icons";
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
import {
  ActivityIcon,
  BuildingIcon,
  Check,
  ChevronsUpDown,
  UsersIcon,
  XIcon,
} from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getInitials } from "@/lib/utils";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";

export function SummaryForSelect({
  size = "sm",
  organizationSlug,
  values,
  onSelect,
  id,
  placeholder,
}: {
  size?: "sm" | "default";
  organizationSlug: string;
  values: ScheduleConfigSummaryFor[];
  onSelect: (value: ScheduleConfigSummaryFor[]) => void;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const members = useQuery(typedQueryOptions(listMembersContract, { idOrSlug: organizationSlug }));
  const teams = useQuery(typedQueryOptions(listTeamsContract, { idOrSlug: organizationSlug }));
  const githubIntegration = useQuery(
    typedQueryOptions(
      getGithubIntegrationContract,
      { idOrSlug: organizationSlug },
      { throwOnError: false },
    ),
  );
  const githubRepositories = useQuery(
    typedQueryOptions(listGithubRepositoriesContract, { idOrSlug: organizationSlug }),
  );
  const slackIntegration = useQuery(
    typedQueryOptions(
      getSlackIntegrationContract,
      { idOrSlug: organizationSlug },
      { throwOnError: false },
    ),
  );
  const slackChannels = useQuery(
    typedQueryOptions(listSlackChannelsContract, { idOrSlug: organizationSlug }),
  );
  const discordIntegration = useQuery(
    typedQueryOptions(
      getDiscordIntegrationContract,
      { idOrSlug: organizationSlug },
      { throwOnError: false },
    ),
  );
  const discordChannels = useQuery(
    typedQueryOptions(listDiscordChannelsContract, { idOrSlug: organizationSlug }),
  );

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
          className={cn(
            "justify-between transition-none",
            values.length > 0 && "max-h-auto h-auto p-1",
            (!values?.length || values.length === 0) && "text-muted-foreground py-2 h-9",
          )}
        >
          <div className="flex items-center gap-2 max-h-auto h-auto flex-wrap max-w-[400px]">
            {(!values?.length || values.length === 0) && (placeholder ?? "Select summary input")}
            {values.map((value) => {
              if (value.type === "organization") {
                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <BuildingIcon className="size-4 m-1" />
                    <span>Everyone's status updates</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.value !== value.value));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.value !== value.value));
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
                          idOrSlug: organizationSlug,
                          fileKey: member.user.image ?? "",
                        })}
                      />
                      <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                    </Avatar>
                    <span>{member.user.name}'s status updates</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.value !== value.value));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.value !== value.value));
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
                    <UsersIcon className="size-4 m-1" />
                    <span>{team.name}'s status updates</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.value !== value.value));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.value !== value.value));
                      }}
                    >
                      <XIcon className="size-3" />
                    </div>
                  </Badge>
                );
              }

              if (value.type === "anyGithub") {
                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiGithub className="size-4 m-1" />
                    <span>Any GitHub activity</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.value !== value.value));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.value !== value.value));
                      }}
                    >
                      <XIcon className="size-3" />
                    </div>
                  </Badge>
                );
              }

              if (value.type === "githubRepository") {
                const repository = githubRepositories.data?.find(
                  (repository) => repository.id === value.value,
                );
                if (!repository) {
                  return null;
                }

                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiGithub className="size-4 m-1" />
                    <span>{repository.name} activity</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.value !== value.value));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.value !== value.value));
                      }}
                    >
                      <XIcon className="size-3" />
                    </div>
                  </Badge>
                );
              }

              if (value.type === "anySlack") {
                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiSlack className="size-4 m-1" />
                    <span>Any Slack activity</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.value !== value.value));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.value !== value.value));
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
                    <SiSlack className="size-4 m-1" />
                    <span>{channel.name} activity</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.value !== value.value));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.value !== value.value));
                      }}
                    >
                      <XIcon className="size-3" />
                    </div>
                  </Badge>
                );
              }

              if (value.type === "anyDiscord") {
                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiDiscord className="size-4 m-1" />
                    <span>Any Discord activity</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.value !== value.value));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.value !== value.value));
                      }}
                    >
                      <XIcon className="size-3" />
                    </div>
                  </Badge>
                );
              }

              if (value.type === "discordChannel") {
                const channel = discordChannels.data?.find((channel) => channel.id === value.value);
                if (!channel) {
                  return null;
                }

                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiDiscord className="size-4 m-1" />
                    <span>{channel.name} activity</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.value !== value.value));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.value !== value.value));
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
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search summary inputs..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandItem
              value="organization"
              onSelect={() => {
                if (values.findIndex((value) => value.type === "organization") !== -1) {
                  onSelect([]);
                } else {
                  onSelect([{ type: "organization", value: "organization" }]);
                }
                setOpen(false);
              }}
            >
              <BuildingIcon className="size-4 m-1" />
              <span>Everyone's status updates</span>
              <Check
                className={cn(
                  "ml-auto",
                  values.findIndex((value) => value.type === "organization") !== -1
                    ? "opacity-100"
                    : "opacity-0",
                )}
              />
            </CommandItem>

            <CommandGroup heading="Users' status updates">
              {members.data?.members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.id}
                  onSelect={() => {
                    const valuesWithoutOrganization = values.filter(
                      (value) => value.type !== "organization",
                    );

                    if (
                      valuesWithoutOrganization.findIndex(
                        (value) => value.type === "member" && value.value === member.id,
                      ) !== -1
                    ) {
                      onSelect([
                        ...valuesWithoutOrganization.filter(
                          (value) => value.type === "member" && value.value !== member.id,
                        ),
                      ]);
                    } else {
                      onSelect([
                        ...valuesWithoutOrganization,
                        { type: "member", value: member.id },
                      ]);
                    }
                    setOpen(false);
                  }}
                >
                  <Avatar className="size-4 text-[0.65rem]">
                    <AvatarImage
                      src={typedUrl(getFileContract, {
                        idOrSlug: organizationSlug,
                        fileKey: member.user.image ?? "",
                      })}
                    />
                    <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                  </Avatar>
                  <span>{member.user.name}</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      values.findIndex(
                        (value) => value.type === "member" && value.value === member.id,
                      ) !== -1
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Teams' status updates">
              {teams.data?.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.id}
                  onSelect={() => {
                    if (
                      values.findIndex(
                        (value) => value.type === "team" && value.value === team.id,
                      ) !== -1
                    ) {
                      onSelect([
                        ...values.filter(
                          (value) => value.type !== "team" || value.value !== team.id,
                        ),
                      ]);
                    } else {
                      onSelect([...values, { type: "team", value: team.id }]);
                    }
                    setOpen(false);
                  }}
                >
                  <UsersIcon className="size-4 m-1" />
                  <span>{team.name}</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      values.findIndex(
                        (value) => value.type === "team" && value.value === team.id,
                      ) !== -1
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            {githubIntegration.data && (
              <CommandGroup heading="GitHub activity">
                <CommandItem
                  value="anyGithub"
                  onSelect={() => {
                    if (values.findIndex((value) => value.type === "anyGithub") !== -1) {
                      onSelect([...values.filter((value) => value.type !== "anyGithub")]);
                    } else {
                      onSelect([...values, { type: "anyGithub", value: "anyGithub" }]);
                    }
                    setOpen(false);
                  }}
                >
                  <SiGithub className="size-4 m-1" />
                  <span>Any GitHub activity</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      values.findIndex((value) => value.type === "anyGithub") !== -1
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>

                {githubRepositories.data?.map((repository) => (
                  <CommandItem
                    key={repository.id}
                    value={repository.id}
                    onSelect={() => {
                      if (
                        values.findIndex(
                          (value) =>
                            value.type === "githubRepository" && value.value === repository.id,
                        ) !== -1
                      ) {
                        onSelect([
                          ...values.filter(
                            (value) =>
                              value.type !== "githubRepository" || value.value !== repository.id,
                          ),
                        ]);
                      } else {
                        onSelect([...values, { type: "githubRepository", value: repository.id }]);
                      }
                      setOpen(false);
                    }}
                  >
                    <SiGithub className="size-4 m-1" />
                    <span>{repository.name}</span>
                    <Check
                      className={cn(
                        "ml-auto",
                        values.findIndex(
                          (value) =>
                            value.type === "githubRepository" && value.value === repository.id,
                        ) !== -1
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {slackIntegration.data && (
              <CommandGroup heading="Slack activity">
                <CommandItem
                  value="anySlack"
                  onSelect={() => {
                    if (values.findIndex((value) => value.type === "anySlack") !== -1) {
                      onSelect([...values.filter((value) => value.type !== "anySlack")]);
                    } else {
                      onSelect([...values, { type: "anySlack", value: "anySlack" }]);
                    }
                    setOpen(false);
                  }}
                >
                  <SiSlack className="size-4 m-1" />
                  <span>Any Slack activity</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      values.findIndex((value) => value.type === "anySlack") !== -1
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>

                {slackChannels.data?.map((channel) => (
                  <CommandItem
                    key={channel.id}
                    value={channel.id}
                    onSelect={() => {
                      if (
                        values.findIndex(
                          (value) => value.type === "slackChannel" && value.value === channel.id,
                        ) !== -1
                      ) {
                        onSelect([
                          ...values.filter(
                            (value) => value.type !== "slackChannel" || value.value !== channel.id,
                          ),
                        ]);
                      } else {
                        onSelect([...values, { type: "slackChannel", value: channel.id }]);
                      }
                      setOpen(false);
                    }}
                  >
                    <SiSlack className="size-4 m-1" />
                    <span>{channel.name}</span>
                    <Check
                      className={cn(
                        "ml-auto",
                        values.findIndex(
                          (value) => value.type === "slackChannel" && value.value === channel.id,
                        ) !== -1
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {discordIntegration.data && (
              <CommandGroup heading="Discord activity">
                <CommandItem
                  value="anyDiscord"
                  onSelect={() => {
                    if (values.findIndex((value) => value.type === "anyDiscord") !== -1) {
                      onSelect([...values.filter((value) => value.type !== "anyDiscord")]);
                    } else {
                      onSelect([...values, { type: "anyDiscord", value: "anyDiscord" }]);
                    }
                    setOpen(false);
                  }}
                >
                  <SiDiscord className="size-4 m-1" />
                  <span>Any Discord activity</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      values.findIndex((value) => value.type === "anyDiscord") !== -1
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>

                {discordChannels.data?.map((channel) => (
                  <CommandItem
                    key={channel.id}
                    value={channel.id}
                    onSelect={() => {
                      if (
                        values.findIndex(
                          (value) => value.type === "discordChannel" && value.value === channel.id,
                        ) !== -1
                      ) {
                        onSelect([
                          ...values.filter(
                            (value) =>
                              value.type !== "discordChannel" || value.value !== channel.id,
                          ),
                        ]);
                      } else {
                        onSelect([...values, { type: "discordChannel", value: channel.id }]);
                      }
                      setOpen(false);
                    }}
                  >
                    <SiDiscord className="size-4 m-1" />
                    <span>{channel.name}</span>
                    <Check
                      className={cn(
                        "ml-auto",
                        values.findIndex(
                          (value) => value.type === "discordChannel" && value.value === channel.id,
                        ) !== -1
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
