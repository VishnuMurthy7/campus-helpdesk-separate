CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`icon` varchar(48) NOT NULL DEFAULT 'CircleHelp',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackingId` varchar(32) NOT NULL,
	`type` enum('complaint','enquiry') NOT NULL,
	`categoryId` int,
	`subcategoryId` int,
	`subject` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`contactName` varchar(120) NOT NULL,
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`),
	CONSTRAINT `complaints_tracking_id_unq` UNIQUE(`trackingId`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBaseEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subcategoryId` int NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeBaseEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subcategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subcategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_subcategoryId_subcategories_id_fk` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `knowledgeBaseEntries` ADD CONSTRAINT `knowledgeBaseEntries_subcategoryId_subcategories_id_fk` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `complaints_status_idx` ON `complaints` (`status`);--> statement-breakpoint
CREATE INDEX `complaints_category_idx` ON `complaints` (`categoryId`);--> statement-breakpoint
CREATE INDEX `knowledge_subcategory_idx` ON `knowledgeBaseEntries` (`subcategoryId`);--> statement-breakpoint
CREATE INDEX `subcategories_category_idx` ON `subcategories` (`categoryId`);