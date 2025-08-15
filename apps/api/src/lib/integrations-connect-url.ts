type DiscordIntegrationConnectUrlParams = {
  clientId: string;
  redirectUri: string;
  organizationSlug: string;
};

export function getDiscordIntegrationConnectUrl(params: DiscordIntegrationConnectUrlParams) {
  return `https://discord.com/oauth2/authorize?client_id=${params.clientId}&permissions=8&scope=bot+identify+email+guilds+guilds.members.read+messages.read&response_type=code&redirect_uri=${encodeURIComponent(params.redirectUri)}&state=${params.organizationSlug}`;
}

type SlackIntegrationConnectUrlParams = {
  clientId: string;
  redirectUri: string;
  organizationSlug: string;
};

export function getSlackIntegrationConnectUrl(params: SlackIntegrationConnectUrlParams) {
  return `https://slack.com/oauth/v2/authorize?state=${params.organizationSlug}&client_id=${params.clientId}&redirect_uri=${encodeURIComponent(params.redirectUri)}&scope=app_mentions:read,channels:history,channels:join,channels:read,chat:write,chat:write.public,commands,emoji:read,files:read,groups:history,groups:read,im:history,im:read,incoming-webhook,mpim:history,mpim:read,pins:read,reactions:read,team:read,users:read,users.profile:read,users:read.email,calls:read,reminders:read,reminders:write,channels:manage,chat:write.customize,im:write,links:read,metadata.message:read,mpim:write,pins:write,reactions:write,dnd:read,usergroups:read,usergroups:write,users:write,remote_files:read,remote_files:write,files:write,groups:write&user_scope=channels:history,channels:read,dnd:read,emoji:read,files:read,groups:history,groups:read,im:history,im:read,mpim:history,mpim:read,pins:read,reactions:read,team:read,users:read,users.profile:read,users:read.email,calls:read,reminders:read,reminders:write,stars:read`;
}

type GithubIntegrationConnectUrlParams = {
  clientId: string;
  redirectUri: string;
  organizationSlug: string;
};

export function getGithubIntegrationConnectUrl(params: GithubIntegrationConnectUrlParams) {
  return `https://github.com/apps/${params.clientId}/installations/new?state=${params.organizationSlug}&redirect_uri=${encodeURIComponent(params.redirectUri)}`;
}
