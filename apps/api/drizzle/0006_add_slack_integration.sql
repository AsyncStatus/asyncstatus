-- Add slack_integration table
CREATE TABLE `slack_integration` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_id` text NOT NULL,
  `team_id` text NOT NULL,
  `team_name` text NOT NULL,
  `bot_user_id` text NOT NULL,
  `bot_access_token` text NOT NULL,
  `installer_user_id` text NOT NULL,
  `scope` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE CASCADE
);

-- Add indexes
CREATE UNIQUE INDEX `slack_organization_unique_idx` ON `slack_integration` (`organization_id`);
CREATE INDEX `slack_organization_id_index` ON `slack_integration` (`organization_id`);
CREATE INDEX `slack_team_id_index` ON `slack_integration` (`team_id`);