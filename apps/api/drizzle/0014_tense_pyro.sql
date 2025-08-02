DROP TABLE `ai_usage`;--> statement-breakpoint
ALTER TABLE `organization` ADD `stripe_customer_id` text;--> statement-breakpoint
ALTER TABLE `organization` ADD `trial_plan` text;--> statement-breakpoint
ALTER TABLE `organization` ADD `trial_start_date` integer;--> statement-breakpoint
ALTER TABLE `organization` ADD `trial_end_date` integer;--> statement-breakpoint
ALTER TABLE `organization` ADD `trial_status` text;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `stripe_customer_id`;