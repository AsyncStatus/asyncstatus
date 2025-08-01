CREATE TABLE `ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`metadata` text,
	`reported_to_stripe` integer DEFAULT false,
	`stripe_usage_record_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ai_usage_user_id_index` ON `ai_usage` (`user_id`);--> statement-breakpoint
CREATE INDEX `ai_usage_organization_id_index` ON `ai_usage` (`organization_id`);--> statement-breakpoint
CREATE INDEX `ai_usage_created_at_index` ON `ai_usage` (`created_at`);--> statement-breakpoint
CREATE INDEX `ai_usage_reported_stripe_index` ON `ai_usage` (`reported_to_stripe`);