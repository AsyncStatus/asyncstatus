import {
  getDiscordIntegrationContract,
  listDiscordChannelsContract,
} from "@asyncstatus/api/typed-handlers/discord-integration";
import {
  getGithubIntegrationContract,
  listGithubRepositoriesContract,
} from "@asyncstatus/api/typed-handlers/github-integration";
import {
  getGitlabIntegrationContract,
  listGitlabProjectsContract,
} from "@asyncstatus/api/typed-handlers/gitlab-integration";
import {
  getLinearIntegrationContract,
  listLinearProjectsContract,
  listLinearTeamsContract,
} from "@asyncstatus/api/typed-handlers/linear-integration";
import type { ScheduleConfigGenerateFor } from "@asyncstatus/api/typed-handlers/schedule";
import {
  getSlackIntegrationContract,
  listSlackChannelsContract,
} from "@asyncstatus/api/typed-handlers/slack-integration";
import { SiDiscord, SiGithub, SiGitlab, SiLinear, SiSlack } from "@asyncstatus/ui/brand-icons";
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
import { ActivityIcon, Check, ChevronsUpDown, XIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { typedQueryOptions } from "@/typed-handlers";

export function GenerateForUsingActivityFromSelect({
  size = "sm",
  organizationSlug,
  values,
  onSelect,
  id,
  placeholder,
}: {
  size?: "sm" | "default";
  organizationSlug: string;
  values: ScheduleConfigGenerateFor["usingActivityFrom"];
  onSelect: (value: ScheduleConfigGenerateFor["usingActivityFrom"]) => void;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
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
  const gitlabIntegration = useQuery(
    typedQueryOptions(
      getGitlabIntegrationContract,
      { idOrSlug: organizationSlug },
      { throwOnError: false },
    ),
  );
  const gitlabProjects = useQuery(
    typedQueryOptions(listGitlabProjectsContract, { idOrSlug: organizationSlug }),
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
  const linearIntegration = useQuery(
    typedQueryOptions(
      getLinearIntegrationContract,
      { idOrSlug: organizationSlug },
      { throwOnError: false },
    ),
  );
  const linearTeams = useQuery(
    typedQueryOptions(listLinearTeamsContract, { idOrSlug: organizationSlug }),
  );
  const linearProjects = useQuery(
    typedQueryOptions(listLinearProjectsContract, { idOrSlug: organizationSlug }),
  );

  const selectedAnyIntegrationActivity = useMemo(() => {
    return values?.findIndex((value) => value.type === "anyIntegration") !== -1;
  }, [values]);

  const selectedAnyGithubActivity = useMemo(() => {
    return values?.findIndex((value) => value.type === "anyGithub") !== -1;
  }, [values]);

  const selectedAnySlackActivity = useMemo(() => {
    return values?.findIndex((value) => value.type === "anySlack") !== -1;
  }, [values]);

  const selectedAnyDiscordActivity = useMemo(() => {
    return values?.findIndex((value) => value.type === "anyDiscord") !== -1;
  }, [values]);

  const selectedAnyGitlabActivity = useMemo(() => {
    return values?.findIndex((value) => value.type === "anyGitlab") !== -1;
  }, [values]);

  const selectedAnyLinearActivity = useMemo(() => {
    return values?.findIndex((value) => value.type === "anyLinear") !== -1;
  }, [values]);

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
            {(!values?.length || values.length === 0) && (placeholder ?? "Select activity")}
            {values.map((value) => {
              if (value.type === "anyIntegration") {
                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <ActivityIcon className="size-4 m-1" />
                    <span>Any activity</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.type !== "anyIntegration"));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.type !== "anyIntegration"));
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
                          onSelect(values.filter((v) => v.type !== "anyGithub"));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.type !== "anyGithub"));
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
                          onSelect(values.filter((v) => v.type !== "anySlack"));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.type !== "anySlack"));
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
                          onSelect(values.filter((v) => v.type !== "anyDiscord"));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.type !== "anyDiscord"));
                      }}
                    >
                      <XIcon className="size-3" />
                    </div>
                  </Badge>
                );
              }

              if (value.type === "anyGitlab") {
                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiGitlab className="size-4 m-1" />
                    <span>Any GitLab activity</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.type !== "anyGitlab"));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.type !== "anyGitlab"));
                      }}
                    >
                      <XIcon className="size-3" />
                    </div>
                  </Badge>
                );
              }

              if (value.type === "anyLinear") {
                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiLinear className="size-4 m-1" />
                    <span>Any Linear activity</span>
                    {/** biome-ignore lint/a11y/useSemanticElements: it's okay */}
                    <div
                      className="ml-auto cursor-pointer hover:bg-muted rounded-full p-1"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelect(values.filter((v) => v.type !== "anyLinear"));
                        }
                      }}
                      onClick={() => {
                        onSelect(values.filter((v) => v.type !== "anyLinear"));
                      }}
                    >
                      <XIcon className="size-3" />
                    </div>
                  </Badge>
                );
              }

              if (value.type === "gitlabProject") {
                const project = gitlabProjects.data?.find((p) => p.id === value.value);
                if (!project) {
                  return null;
                }

                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiGitlab className="size-4 m-1" />
                    <span>{project.name} activity</span>
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

              if (value.type === "linearTeam") {
                const team = linearTeams.data?.find((team) => team.teamId === value.value);
                if (!team) {
                  return null;
                }

                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiLinear className="size-4 m-1" />
                    <span>{team.name} activity</span>
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

              if (value.type === "linearProject") {
                const project = linearProjects.data?.find(
                  (project) => project.projectId === value.value,
                );
                if (!project) {
                  return null;
                }

                return (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-2 text-[0.65rem]"
                    key={value.value}
                  >
                    <SiLinear className="size-4 m-1" />
                    <span>{project.name} activity</span>
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
            })}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search activity..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandItem
              value="anyIntegration"
              onSelect={() => {
                if (values.findIndex((value) => value.type === "anyIntegration") !== -1) {
                  onSelect([]);
                } else {
                  onSelect([{ type: "anyIntegration", value: "anyIntegration" }]);
                }
                setOpen(false);
              }}
            >
              <ActivityIcon className="size-4 m-1" />
              <span>Any activity</span>
              <Check
                className={cn(
                  "ml-auto",
                  selectedAnyIntegrationActivity ? "opacity-100" : "opacity-0",
                )}
              />
            </CommandItem>

            {githubIntegration.data && (
              <CommandGroup heading="GitHub">
                <CommandItem
                  value="github"
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
                      selectedAnyGithubActivity ? "opacity-100" : "opacity-0",
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
              <CommandGroup heading="Slack">
                <CommandItem
                  value="slack"
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
                      selectedAnySlackActivity ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>

                {slackChannels.data?.map((channel) => (
                  <CommandItem key={channel.id} value={channel.id}>
                    <SiSlack className="size-4 m-1" />
                    <span>{channel.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {discordIntegration.data && (
              <CommandGroup heading="Discord">
                <CommandItem
                  value="discord"
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
                      selectedAnyDiscordActivity ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>

                {discordChannels.data?.map((channel) => (
                  <CommandItem key={channel.id} value={channel.id}>
                    <SiDiscord className="size-4 m-1" />
                    <span>{channel.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {linearIntegration.data && (
              <CommandGroup heading="Linear">
                <CommandItem
                  value="linear"
                  onSelect={() => {
                    if (values.findIndex((value) => value.type === "anyLinear") !== -1) {
                      onSelect([...values.filter((value) => value.type !== "anyLinear")]);
                    } else {
                      onSelect([...values, { type: "anyLinear", value: "anyLinear" }]);
                    }
                    setOpen(false);
                  }}
                >
                  <SiLinear className="size-4 m-1" />
                  <span>Any Linear activity</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedAnyLinearActivity ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>

                {linearTeams.data?.map((team) => (
                  <CommandItem
                    key={team.teamId}
                    value={team.teamId}
                    onSelect={() => {
                      if (
                        values.findIndex(
                          (value) => value.type === "linearTeam" && value.value === team.teamId,
                        ) !== -1
                      ) {
                        onSelect([
                          ...values.filter(
                            (value) => value.type !== "linearTeam" || value.value !== team.teamId,
                          ),
                        ]);
                      } else {
                        onSelect([...values, { type: "linearTeam", value: team.teamId }]);
                      }
                      setOpen(false);
                    }}
                  >
                    <SiLinear className="size-4 m-1" />
                    <span>{team.name}</span>
                    <Check
                      className={cn(
                        "ml-auto",
                        values.findIndex(
                          (value) => value.type === "linearTeam" && value.value === team.teamId,
                        ) !== -1
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}

                {linearProjects.data?.map((project) => (
                  <CommandItem
                    key={project.projectId}
                    value={project.projectId}
                    onSelect={() => {
                      if (
                        values.findIndex(
                          (value) =>
                            value.type === "linearProject" && value.value === project.projectId,
                        ) !== -1
                      ) {
                        onSelect([
                          ...values.filter(
                            (value) =>
                              value.type !== "linearProject" || value.value !== project.projectId,
                          ),
                        ]);
                      } else {
                        onSelect([...values, { type: "linearProject", value: project.projectId }]);
                      }
                      setOpen(false);
                    }}
                  >
                    <SiLinear className="size-4 m-1" />
                    <span>{project.name}</span>
                    <Check
                      className={cn(
                        "ml-auto",
                        values.findIndex(
                          (value) =>
                            value.type === "linearProject" && value.value === project.projectId,
                        ) !== -1
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {gitlabIntegration.data && (
              <CommandGroup heading="GitLab">
                <CommandItem
                  value="gitlab"
                  onSelect={() => {
                    if (values.findIndex((value) => value.type === "anyGitlab") !== -1) {
                      onSelect([...values.filter((value) => value.type !== "anyGitlab")]);
                    } else {
                      onSelect([...values, { type: "anyGitlab", value: "anyGitlab" }]);
                    }
                    setOpen(false);
                  }}
                >
                  <SiGitlab className="size-4 m-1" />
                  <span>Any GitLab activity</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedAnyGitlabActivity ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>

                {gitlabProjects.data?.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.id}
                    onSelect={() => {
                      if (
                        values.findIndex(
                          (value) => value.type === "gitlabProject" && value.value === project.id,
                        ) !== -1
                      ) {
                        onSelect([
                          ...values.filter(
                            (value) => value.type !== "gitlabProject" || value.value !== project.id,
                          ),
                        ]);
                      } else {
                        onSelect([...values, { type: "gitlabProject", value: project.id }]);
                      }
                      setOpen(false);
                    }}
                  >
                    <SiGitlab className="size-4 m-1" />
                    <span>{project.name}</span>
                    <Check
                      className={cn(
                        "ml-auto",
                        values.findIndex(
                          (value) => value.type === "gitlabProject" && value.value === project.id,
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
