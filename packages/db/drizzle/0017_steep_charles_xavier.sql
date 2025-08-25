ALTER TABLE `user` ADD `show_onboarding` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `onboarding_step` text;--> statement-breakpoint
ALTER TABLE `user` ADD `onboarding_completed_at` integer;