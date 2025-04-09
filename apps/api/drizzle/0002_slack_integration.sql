-- Add Slack workspace table
CREATE TABLE `slack_workspace` (
  `id` text PRIMARY KEY NOT NULL,
  `team_id` text NOT NULL,
  `team_name` text NOT NULL,
  `bot_user_id` text NOT NULL,
  `bot_access_token` text NOT NULL,
  `created_at` integer NOT NULL
);

-- Create index on team_id for faster lookups
CREATE INDEX `slack_workspace_team_id_idx` ON `slack_workspace` (`team_id`);

-- Add Slack integration table linking workspaces to organizations
CREATE TABLE `slack_integration` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL,
  `slack_workspace_id` text NOT NULL,
  `created_by_id` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `settings` text,
  FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`slack_workspace_id`) REFERENCES `slack_workspace`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Create indexes for faster lookups
CREATE INDEX `slack_integration_org_idx` ON `slack_integration` (`organization_id`);
CREATE INDEX `slack_integration_workspace_idx` ON `slack_integration` (`slack_workspace_id`);
