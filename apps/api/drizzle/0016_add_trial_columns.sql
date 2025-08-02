ALTER TABLE `organization` ADD COLUMN `trial_plan` text CHECK(trial_plan IN ('basic', 'startup', 'enterprise'));--> statement-breakpoint
ALTER TABLE `organization` ADD COLUMN `trial_start_date` integer;--> statement-breakpoint
ALTER TABLE `organization` ADD COLUMN `trial_end_date` integer;--> statement-breakpoint
ALTER TABLE `organization` ADD COLUMN `trial_status` text CHECK(trial_status IN ('active', 'expired', 'converted', 'cancelled'));