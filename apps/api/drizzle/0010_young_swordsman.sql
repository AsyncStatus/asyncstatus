CREATE TABLE `schedule` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`created_by_member_id` text NOT NULL,
	`action_type` text NOT NULL,
	`delivery_method` text NOT NULL,
	`recurrence` text NOT NULL,
	`timezone` text NOT NULL,
	`day_of_week` integer,
	`day_of_month` integer,
	`time_of_day` text NOT NULL,
	`auto_generate_from_integrations` integer DEFAULT false,
	`reminder_message_template` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `schedule_organization_id_index` ON `schedule` (`organization_id`);--> statement-breakpoint
CREATE INDEX `schedule_action_type_index` ON `schedule` (`action_type`);--> statement-breakpoint
CREATE INDEX `schedule_active_index` ON `schedule` (`is_active`);--> statement-breakpoint
CREATE TABLE `schedule_run` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`created_by_member_id` text NOT NULL,
	`schedule_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`next_execution_at` integer,
	`last_execution_at` integer,
	`last_execution_status` text,
	`last_execution_error` text,
	`execution_count` integer DEFAULT 0 NOT NULL,
	`execution_metadata` text,
	`durable_object_id` text,
	`alarm_id` text,
	`max_retries` integer DEFAULT 3,
	`current_retries` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedule`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `schedule_run_organization_id_index` ON `schedule_run` (`organization_id`);--> statement-breakpoint
CREATE INDEX `schedule_run_schedule_id_index` ON `schedule_run` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `schedule_run_status_index` ON `schedule_run` (`status`);--> statement-breakpoint
CREATE INDEX `schedule_run_next_execution_index` ON `schedule_run` (`next_execution_at`);--> statement-breakpoint
CREATE INDEX `schedule_run_durable_object_index` ON `schedule_run` (`durable_object_id`);--> statement-breakpoint
CREATE TABLE `schedule_target` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_id` text NOT NULL,
	`target_type` text NOT NULL,
	`team_id` text,
	`member_id` text,
	`slack_channel_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedule`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`slack_channel_id`) REFERENCES `slack_channel`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `schedule_target_schedule_id_index` ON `schedule_target` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `schedule_target_type_index` ON `schedule_target` (`target_type`);--> statement-breakpoint
CREATE INDEX `schedule_target_team_id_index` ON `schedule_target` (`team_id`);--> statement-breakpoint
CREATE INDEX `schedule_target_member_id_index` ON `schedule_target` (`member_id`);--> statement-breakpoint
CREATE INDEX `schedule_target_slack_channel_id_index` ON `schedule_target` (`slack_channel_id`);