CREATE TABLE `adminAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collegeId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `adminAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminAccounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `adminPasswordResets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminPasswordResets_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminPasswordResets_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `adminSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminSessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `knowledgeBaseEntries` ADD `imageKey` varchar(512);--> statement-breakpoint
ALTER TABLE `knowledgeBaseEntries` ADD `imageUrl` varchar(768);--> statement-breakpoint
ALTER TABLE `adminAccounts` ADD CONSTRAINT `adminAccounts_collegeId_colleges_id_fk` FOREIGN KEY (`collegeId`) REFERENCES `colleges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adminPasswordResets` ADD CONSTRAINT `adminPasswordResets_adminId_adminAccounts_id_fk` FOREIGN KEY (`adminId`) REFERENCES `adminAccounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adminSessions` ADD CONSTRAINT `adminSessions_adminId_adminAccounts_id_fk` FOREIGN KEY (`adminId`) REFERENCES `adminAccounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_accounts_college_idx` ON `adminAccounts` (`collegeId`);--> statement-breakpoint
CREATE INDEX `admin_resets_admin_idx` ON `adminPasswordResets` (`adminId`);--> statement-breakpoint
CREATE INDEX `admin_resets_expiry_idx` ON `adminPasswordResets` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `admin_sessions_admin_idx` ON `adminSessions` (`adminId`);--> statement-breakpoint
CREATE INDEX `admin_sessions_expiry_idx` ON `adminSessions` (`expiresAt`);