CREATE TABLE `user_timezone_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`timezone` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_timezone_history_user_id_index` ON `user_timezone_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_timezone_history_created_at_index` ON `user_timezone_history` (`created_at`);--> statement-breakpoint
ALTER TABLE `status_update` ADD `timezone` text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `timezone` text DEFAULT 'UTC' NOT NULL;