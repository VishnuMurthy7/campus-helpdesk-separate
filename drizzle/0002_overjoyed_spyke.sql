CREATE TABLE `colleges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`code` varchar(48) NOT NULL,
	`location` varchar(160),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `colleges_id` PRIMARY KEY(`id`),
	CONSTRAINT `colleges_code_unq` UNIQUE(`code`)
);
--> statement-breakpoint
INSERT INTO `colleges` (`name`, `code`, `location`, `description`, `isActive`) VALUES ('Riverside College', 'RIVERSIDE', 'Main Campus', 'A sample college configuration for the Campus Helpdesk demo.', true);--> statement-breakpoint
ALTER TABLE `categories` ADD `collegeId` int;--> statement-breakpoint
ALTER TABLE `complaints` ADD `collegeId` int;--> statement-breakpoint
UPDATE `categories` SET `collegeId` = (SELECT `id` FROM `colleges` WHERE `code` = 'RIVERSIDE' LIMIT 1) WHERE `collegeId` IS NULL;--> statement-breakpoint
UPDATE `complaints` SET `collegeId` = (SELECT `id` FROM `colleges` WHERE `code` = 'RIVERSIDE' LIMIT 1) WHERE `collegeId` IS NULL;--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `collegeId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `complaints` MODIFY COLUMN `collegeId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_collegeId_colleges_id_fk` FOREIGN KEY (`collegeId`) REFERENCES `colleges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_collegeId_colleges_id_fk` FOREIGN KEY (`collegeId`) REFERENCES `colleges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categories_college_idx` ON `categories` (`collegeId`);--> statement-breakpoint
CREATE INDEX `complaints_college_idx` ON `complaints` (`collegeId`);
