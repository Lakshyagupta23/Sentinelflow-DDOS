CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` varchar(64) NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`conditions` json NOT NULL,
	`logicalOperator` enum('AND','OR') NOT NULL DEFAULT 'AND',
	`actions` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_rules_ruleId_unique` UNIQUE(`ruleId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int NOT NULL,
	`type` enum('attack_detected','alert_triggered','playbook_executed','threat_detected') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedAttackId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `notifications_notificationId_unique` UNIQUE(`notificationId`)
);
--> statement-breakpoint
CREATE TABLE `threat_intelligence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threatId` varchar(64) NOT NULL,
	`sourceIp` varchar(45) NOT NULL,
	`reputation` enum('malicious','suspicious','clean') NOT NULL,
	`threatLevel` enum('critical','high','medium','low') NOT NULL,
	`threatType` varchar(255),
	`threatActor` varchar(255),
	`knownBotnets` json,
	`vulnerabilities` json,
	`lastSeen` timestamp,
	`source` varchar(64),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `threat_intelligence_id` PRIMARY KEY(`id`),
	CONSTRAINT `threat_intelligence_threatId_unique` UNIQUE(`threatId`)
);
