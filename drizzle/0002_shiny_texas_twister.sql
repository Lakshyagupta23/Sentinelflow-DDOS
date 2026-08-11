CREATE TABLE `organization_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`ownerId` int NOT NULL,
	`logo` varchar(255),
	`website` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_orgId_unique` UNIQUE(`orgId`)
);
--> statement-breakpoint
CREATE TABLE `playbook_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` varchar(64) NOT NULL,
	`playbookId` int NOT NULL,
	`attackId` int,
	`status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`executedBy` int NOT NULL,
	`result` json,
	`startTime` timestamp,
	`endTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playbook_executions_id` PRIMARY KEY(`id`),
	CONSTRAINT `playbook_executions_executionId_unique` UNIQUE(`executionId`)
);
--> statement-breakpoint
CREATE TABLE `playbooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookId` varchar(64) NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`attackType` enum('volumetric','protocol','application_layer','custom') NOT NULL,
	`steps` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playbooks_id` PRIMARY KEY(`id`),
	CONSTRAINT `playbooks_playbookId_unique` UNIQUE(`playbookId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `organizationId` int;