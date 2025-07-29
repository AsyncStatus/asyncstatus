CREATE TABLE `schedule` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`created_by_member_id` text,
	`name` text NOT NULL,
	`config` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `schedule_organization_id_index` ON `schedule` (`organization_id`);--> statement-breakpoint
CREATE INDEX `schedule_created_by_member_id_index` ON `schedule` (`created_by_member_id`);--> statement-breakpoint
CREATE INDEX `schedule_active_index` ON `schedule` (`is_active`);--> statement-breakpoint
CREATE INDEX `schedule_name_index` ON `schedule` (`name`);--> statement-breakpoint
CREATE TABLE `schedule_run` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_id` text NOT NULL,
	`created_by_member_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`next_execution_at` integer,
	`last_execution_at` integer,
	`last_execution_error` text,
	`execution_count` integer DEFAULT 0 NOT NULL,
	`execution_metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedule`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `schedule_run_schedule_id_index` ON `schedule_run` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `schedule_run_status_index` ON `schedule_run` (`status`);--> statement-breakpoint
CREATE INDEX `schedule_run_next_execution_index` ON `schedule_run` (`next_execution_at`);--> statement-breakpoint
CREATE TABLE `schedule_run_task` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_run_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`results` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`schedule_run_id`) REFERENCES `schedule_run`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `schedule_run_task_schedule_run_id` ON `schedule_run_task` (`schedule_run_id`);--> statement-breakpoint
CREATE INDEX `schedule_run_task_status` ON `schedule_run_task` (`status`);