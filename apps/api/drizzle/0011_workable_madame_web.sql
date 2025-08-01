CREATE TABLE `stripe_customer` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_customer_user_id_unique` ON `stripe_customer` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_customer_stripe_customer_id_unique` ON `stripe_customer` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `stripe_customer_user_id_index` ON `stripe_customer` (`user_id`);--> statement-breakpoint
CREATE INDEX `stripe_customer_stripe_customer_id_index` ON `stripe_customer` (`stripe_customer_id`);