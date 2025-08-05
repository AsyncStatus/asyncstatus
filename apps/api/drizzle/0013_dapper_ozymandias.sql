CREATE TABLE `discord_channel` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`guild_id` text NOT NULL,
	`name` text NOT NULL,
	`type` integer NOT NULL,
	`position` integer,
	`parent_id` text,
	`topic` text,
	`nsfw` integer DEFAULT false,
	`is_private` integer DEFAULT false,
	`is_archived` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`server_id`) REFERENCES `discord_server`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discord_channel_channel_id_unique` ON `discord_channel` (`channel_id`);--> statement-breakpoint
CREATE INDEX `discord_channel_server_id_index` ON `discord_channel` (`server_id`);--> statement-breakpoint
CREATE INDEX `discord_channel_channel_id_index` ON `discord_channel` (`channel_id`);--> statement-breakpoint
CREATE INDEX `discord_channel_guild_id_index` ON `discord_channel` (`guild_id`);--> statement-breakpoint
CREATE INDEX `discord_channel_type_index` ON `discord_channel` (`type`);--> statement-breakpoint
CREATE TABLE `discord_event` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text NOT NULL,
	`discord_event_id` text NOT NULL,
	`discord_user_id` text,
	`channel_id` text,
	`type` text NOT NULL,
	`payload` text,
	`message_id` text,
	`thread_id` text,
	`created_at` integer NOT NULL,
	`inserted_at` integer NOT NULL,
	FOREIGN KEY (`server_id`) REFERENCES `discord_server`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`discord_user_id`) REFERENCES `discord_user`(`discord_user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`channel_id`) REFERENCES `discord_channel`(`channel_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discord_event_discord_event_id_unique` ON `discord_event` (`discord_event_id`);--> statement-breakpoint
CREATE INDEX `discord_event_server_id_idx` ON `discord_event` (`server_id`);--> statement-breakpoint
CREATE INDEX `discord_event_channel_id_idx` ON `discord_event` (`channel_id`);--> statement-breakpoint
CREATE INDEX `discord_event_created_at_idx` ON `discord_event` (`created_at`);--> statement-breakpoint
CREATE INDEX `discord_event_discord_event_id_idx` ON `discord_event` (`discord_event_id`);--> statement-breakpoint
CREATE INDEX `discord_event_discord_user_id_idx` ON `discord_event` (`discord_user_id`);--> statement-breakpoint
CREATE INDEX `discord_event_type_idx` ON `discord_event` (`type`);--> statement-breakpoint
CREATE INDEX `discord_event_message_id_idx` ON `discord_event` (`message_id`);--> statement-breakpoint
CREATE TABLE `discord_integration` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`guild_id` text NOT NULL,
	`guild_name` text,
	`bot_access_token` text NOT NULL,
	`bot_scopes` text,
	`bot_permissions` text,
	`bot_user_id` text,
	`application_id` text,
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
CREATE UNIQUE INDEX `discord_integration_guild_id_unique` ON `discord_integration` (`guild_id`);--> statement-breakpoint
CREATE INDEX `discord_organization_id_index` ON `discord_integration` (`organization_id`);--> statement-breakpoint
CREATE INDEX `discord_sync_id_index` ON `discord_integration` (`sync_id`);--> statement-breakpoint
CREATE INDEX `discord_delete_id_index` ON `discord_integration` (`delete_id`);--> statement-breakpoint
CREATE INDEX `discord_guild_id_index` ON `discord_integration` (`guild_id`);--> statement-breakpoint
CREATE TABLE `discord_server` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`guild_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`description` text,
	`owner_id` text,
	`member_count` integer,
	`premium_tier` integer,
	`preferred_locale` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `discord_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discord_server_guild_id_unique` ON `discord_server` (`guild_id`);--> statement-breakpoint
CREATE INDEX `discord_server_integration_id_index` ON `discord_server` (`integration_id`);--> statement-breakpoint
CREATE INDEX `discord_server_guild_id_index` ON `discord_server` (`guild_id`);--> statement-breakpoint
CREATE TABLE `discord_user` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`discord_user_id` text NOT NULL,
	`username` text NOT NULL,
	`discriminator` text,
	`global_name` text,
	`email` text,
	`avatar_hash` text,
	`is_bot` integer DEFAULT false,
	`is_system` integer DEFAULT false,
	`locale` text,
	`verified` integer DEFAULT false,
	`mfa_enabled` integer DEFAULT false,
	`premium_type` integer,
	`access_token` text,
	`scopes` text,
	`token_expires_at` integer,
	`refresh_token` text,
	`is_installer` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`integration_id`) REFERENCES `discord_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discord_user_discord_user_id_unique` ON `discord_user` (`discord_user_id`);--> statement-breakpoint
CREATE INDEX `discord_user_integration_id_index` ON `discord_user` (`integration_id`);--> statement-breakpoint
CREATE INDEX `discord_user_discord_user_id_index` ON `discord_user` (`discord_user_id`);--> statement-breakpoint
CREATE INDEX `discord_user_username_index` ON `discord_user` (`username`);--> statement-breakpoint
ALTER TABLE `member` ADD `discord_id` text;--> statement-breakpoint
CREATE INDEX `member_discord_id_index` ON `member` (`discord_id`);