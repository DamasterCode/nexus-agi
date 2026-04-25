CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL DEFAULT 'New Conversation',
	`model` varchar(128) NOT NULL DEFAULT 'qwen3.5-9b',
	`uncensoredMode` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learningLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int,
	`improvementType` enum('code_generation','code_review','bug_fix','optimization','documentation') NOT NULL,
	`originalCode` text,
	`improvedCode` text,
	`suggestion` text,
	`feedback` text,
	`rating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learningLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modelConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`modelName` varchar(128) NOT NULL,
	`modelType` enum('ollama','llama_cpp','api','local') NOT NULL,
	`endpoint` varchar(512),
	`isActive` boolean NOT NULL DEFAULT false,
	`isOffline` boolean NOT NULL DEFAULT false,
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modelConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`assignedTo` varchar(128) NOT NULL DEFAULT 'nexus',
	`result` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
