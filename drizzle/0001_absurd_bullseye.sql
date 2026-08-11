CREATE TABLE `alert_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`threshold` decimal(10,2) NOT NULL,
	`notificationChannels` json NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` varchar(64) NOT NULL,
	`type` enum('traffic_spike','anomaly','attack_detected','threshold_exceeded') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`attackId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `alerts_alertId_unique` UNIQUE(`alertId`)
);
--> statement-breakpoint
CREATE TABLE `attacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attackId` varchar(64) NOT NULL,
	`type` enum('volumetric','protocol','application_layer') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`status` enum('ongoing','mitigated','resolved') NOT NULL DEFAULT 'ongoing',
	`sourceIp` varchar(45),
	`destinationUrl` text,
	`peakTraffic` decimal(15,2),
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`duration` int,
	`mitigationStatus` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attacks_id` PRIMARY KEY(`id`),
	CONSTRAINT `attacks_attackId_unique` UNIQUE(`attackId`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(255) NOT NULL,
	`resourceType` varchar(64) NOT NULL,
	`resourceId` varchar(64),
	`details` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mitigation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` varchar(64) NOT NULL,
	`type` enum('ip_block','rate_limit','captcha_challenge','geo_block') NOT NULL,
	`target` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`threshold` int,
	`duration` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mitigation_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `mitigation_rules_ruleId_unique` UNIQUE(`ruleId`)
);
--> statement-breakpoint
CREATE TABLE `top_attack_vectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vectorType` enum('source_ip','destination_url','user_agent','country') NOT NULL,
	`value` varchar(255) NOT NULL,
	`count` int NOT NULL,
	`attackId` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `top_attack_vectors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `traffic_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL,
	`trafficVolume` decimal(15,2) NOT NULL,
	`requestRate` decimal(15,2) NOT NULL,
	`protocolBreakdown` json NOT NULL,
	`sourceCountry` varchar(2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `traffic_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','security_analyst','devops_sre','it_manager') NOT NULL DEFAULT 'user';