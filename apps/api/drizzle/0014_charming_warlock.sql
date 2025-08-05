ALTER TABLE `discord_integration` ADD `gateway_durable_object_id` text;--> statement-breakpoint
CREATE INDEX `discord_gateway_do_id_index` ON `discord_integration` (`gateway_durable_object_id`);