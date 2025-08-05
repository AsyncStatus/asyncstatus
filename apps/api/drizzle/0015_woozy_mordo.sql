CREATE TABLE `discord_event_vector` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`embedding_text` text NOT NULL,
	`embedding` F32_BLOB(1024) NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `discord_event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `discord_event_vector_event_id_idx` ON `discord_event_vector` (`event_id`);--> statement-breakpoint
CREATE INDEX `discord_event_vector_embedding_idx` ON `discord_event_vector`(libsql_vector_idx(embedding));