CREATE TABLE `slack_channel` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`name` text NOT NULL,
	`is_private` integer NOT NULL,
	`is_archived` integer DEFAULT false,
	`is_general` integer DEFAULT false,
	`is_im` integer DEFAULT false,
	`is_mpim` integer DEFAULT false,
	`is_group` integer DEFAULT false,
	`is_shared` integer DEFAULT false,
	`purpose` text,
	`topic` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `slack_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `slack_channel_channel_id_unique` ON `slack_channel` (`channel_id`);--> statement-breakpoint
CREATE INDEX `slack_channel_integration_id_index` ON `slack_channel` (`integration_id`);--> statement-breakpoint
CREATE INDEX `slack_channel_channel_id_index` ON `slack_channel` (`channel_id`);--> statement-breakpoint
CREATE INDEX `slack_channel_name_index` ON `slack_channel` (`name`);--> statement-breakpoint
CREATE TABLE `slack_event` (
	`id` text PRIMARY KEY NOT NULL,
	`slack_event_id` text NOT NULL,
	`slack_user_id` text,
	`channel_id` text,
	`type` text NOT NULL,
	`payload` text,
	`message_ts` text,
	`thread_ts` text,
	`created_at` integer NOT NULL,
	`inserted_at` integer NOT NULL,
	FOREIGN KEY (`slack_user_id`) REFERENCES `slack_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`channel_id`) REFERENCES `slack_channel`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `slack_event_slack_event_id_unique` ON `slack_event` (`slack_event_id`);--> statement-breakpoint
CREATE INDEX `slack_event_channel_id_idx` ON `slack_event` (`channel_id`);--> statement-breakpoint
CREATE INDEX `slack_event_created_at_idx` ON `slack_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `slack_event_slack_event_id_idx` ON `slack_event` (`slack_event_id`);--> statement-breakpoint
CREATE INDEX `slack_event_slack_user_id_idx` ON `slack_event` (`slack_user_id`);--> statement-breakpoint
CREATE INDEX `slack_event_type_idx` ON `slack_event` (`type`);--> statement-breakpoint
CREATE INDEX `slack_event_message_ts_idx` ON `slack_event` (`message_ts`);--> statement-breakpoint
CREATE TABLE `slack_event_vector` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`embedding_text` text NOT NULL,
	`embedding` F32_BLOB(1024) NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `slack_event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `slack_event_vector_event_id_idx` ON `slack_event_vector` (`event_id`);--> statement-breakpoint
CREATE TABLE `slack_integration` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`team_id` text NOT NULL,
	`team_name` text,
	`enterprise_id` text,
	`enterprise_name` text,
	`bot_access_token` text NOT NULL,
	`bot_scopes` text,
	`bot_user_id` text,
	`app_id` text,
	`token_expires_at` integer,
	`refresh_token` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`sync_id` text,
	`sync_updated_at` integer,
	`sync_started_at` integer,
	`sync_finished_at` integer,
	`sync_error` text,
	`sync_error_at` integer,
	`delete_id` text,
	`delete_error` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `slack_organization_id_index` ON `slack_integration` (`organization_id`);--> statement-breakpoint
CREATE INDEX `slack_team_id_index` ON `slack_integration` (`team_id`);--> statement-breakpoint
CREATE INDEX `slack_sync_id_index` ON `slack_integration` (`sync_id`);--> statement-breakpoint
CREATE TABLE `slack_user` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`slack_user_id` text NOT NULL,
	`username` text,
	`display_name` text,
	`email` text,
	`avatar_url` text,
	`access_token` text,
	`scopes` text,
	`token_expires_at` integer,
	`refresh_token` text,
	`is_installer` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `slack_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `slack_user_slack_user_id_unique` ON `slack_user` (`slack_user_id`);--> statement-breakpoint
CREATE INDEX `slack_user_integration_id_index` ON `slack_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `slack_user_slack_user_id_index` ON `slack_user` (`slack_user_id`);--> statement-breakpoint
ALTER TABLE `member` ADD `slack_id` text;--> statement-breakpoint
CREATE INDEX `member_slack_id_index` ON `member` (`slack_id`);--> statement-breakpoint
CREATE INDEX `slack_event_vector_embedding_idx` ON `slack_event_vector`(libsql_vector_idx(embedding));