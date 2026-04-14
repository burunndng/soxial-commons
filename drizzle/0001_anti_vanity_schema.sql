CREATE TABLE `ephemeralSessions` (
`id` int AUTO_INCREMENT NOT NULL,
`userId` int NOT NULL,
`pseudonym` varchar(64) NOT NULL,
`sessionToken` varchar(256) NOT NULL,
`expiresAt` timestamp NOT NULL,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `ephemeralSessions_id` PRIMARY KEY(`id`),
CONSTRAINT `ephemeralSessions_sessionToken_unique` UNIQUE(`sessionToken`),
CONSTRAINT `ephemeralSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade
);

CREATE TABLE `communities` (
`id` int AUTO_INCREMENT NOT NULL,
`name` varchar(64) NOT NULL,
`displayName` varchar(128) NOT NULL,
`description` text,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `communities_id` PRIMARY KEY(`id`),
CONSTRAINT `communities_name_unique` UNIQUE(`name`)
);

CREATE TABLE `posts` (
`id` int AUTO_INCREMENT NOT NULL,
`communityId` int NOT NULL,
`authorSessionId` int NOT NULL,
`title` varchar(300) NOT NULL,
`body` text,
`url` varchar(2048),
`isStub` boolean NOT NULL DEFAULT false,
`isCollaborative` boolean NOT NULL DEFAULT false,
`requiresConsensus` boolean NOT NULL DEFAULT false,
`opposingEndorsementsNeeded` int NOT NULL DEFAULT 0,
`opposingEndorsementsReceived` int NOT NULL DEFAULT 0,
`isVisibleToWider` boolean NOT NULL DEFAULT true,
`createdAt` timestamp NOT NULL DEFAULT (now()),
`expiresAt` timestamp,
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `posts_id` PRIMARY KEY(`id`),
CONSTRAINT `posts_communityId_communities_id_fk` FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON DELETE cascade,
CONSTRAINT `posts_authorSessionId_ephemeralSessions_id_fk` FOREIGN KEY (`authorSessionId`) REFERENCES `ephemeralSessions`(`id`) ON DELETE cascade
);

CREATE TABLE `postVotes` (
`id` int AUTO_INCREMENT NOT NULL,
`postId` int NOT NULL,
`sessionId` int NOT NULL,
`value` enum('1','-1') NOT NULL,
`isHidden` boolean NOT NULL DEFAULT true,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `postVotes_id` PRIMARY KEY(`id`),
CONSTRAINT `postVotes_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade,
CONSTRAINT `postVotes_sessionId_ephemeralSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ephemeralSessions`(`id`) ON DELETE cascade
);

CREATE TABLE `comments` (
`id` int AUTO_INCREMENT NOT NULL,
`postId` int NOT NULL,
`authorSessionId` int NOT NULL,
`parentId` int,
`body` text NOT NULL,
`isSteelmanned` boolean NOT NULL DEFAULT false,
`createdAt` timestamp NOT NULL DEFAULT (now()),
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `comments_id` PRIMARY KEY(`id`),
CONSTRAINT `comments_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade,
CONSTRAINT `comments_authorSessionId_ephemeralSessions_id_fk` FOREIGN KEY (`authorSessionId`) REFERENCES `ephemeralSessions`(`id`) ON DELETE cascade,
CONSTRAINT `comments_parentId_comments_id_fk` FOREIGN KEY (`parentId`) REFERENCES `comments`(`id`) ON DELETE cascade
);

CREATE TABLE `commentVotes` (
`id` int AUTO_INCREMENT NOT NULL,
`commentId` int NOT NULL,
`sessionId` int NOT NULL,
`value` enum('1','-1') NOT NULL,
`isHidden` boolean NOT NULL DEFAULT true,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `commentVotes_id` PRIMARY KEY(`id`),
CONSTRAINT `commentVotes_commentId_comments_id_fk` FOREIGN KEY (`commentId`) REFERENCES `comments`(`id`) ON DELETE cascade,
CONSTRAINT `commentVotes_sessionId_ephemeralSessions_id_fk` FOREIGN KEY (`sessionId`) REFERENCES `ephemeralSessions`(`id`) ON DELETE cascade
);

CREATE TABLE `steelmanRequirements` (
`id` int AUTO_INCREMENT NOT NULL,
`targetCommentId` int NOT NULL,
`respondingSessionId` int NOT NULL,
`requiredRestatement` text,
`isApproved` boolean NOT NULL DEFAULT false,
`approvedAt` timestamp,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `steelmanRequirements_id` PRIMARY KEY(`id`),
CONSTRAINT `steelmanRequirements_targetCommentId_comments_id_fk` FOREIGN KEY (`targetCommentId`) REFERENCES `comments`(`id`) ON DELETE cascade,
CONSTRAINT `steelmanRequirements_respondingSessionId_ephemeralSessions_id_fk` FOREIGN KEY (`respondingSessionId`) REFERENCES `ephemeralSessions`(`id`) ON DELETE cascade
);

CREATE TABLE `consensusEndorsements` (
`id` int AUTO_INCREMENT NOT NULL,
`postId` int NOT NULL,
`endorsingSessionId` int NOT NULL,
`viewpoint` enum('supporting','opposing') NOT NULL,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `consensusEndorsements_id` PRIMARY KEY(`id`),
CONSTRAINT `consensusEndorsements_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade,
CONSTRAINT `consensusEndorsements_endorsingSessionId_ephemeralSessions_id_fk` FOREIGN KEY (`endorsingSessionId`) REFERENCES `ephemeralSessions`(`id`) ON DELETE cascade
);

CREATE TABLE `postCollaborators` (
`id` int AUTO_INCREMENT NOT NULL,
`postId` int NOT NULL,
`collaboratorSessionId` int NOT NULL,
`joinedAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `postCollaborators_id` PRIMARY KEY(`id`),
CONSTRAINT `postCollaborators_postId_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE cascade,
CONSTRAINT `postCollaborators_collaboratorSessionId_ephemeralSessions_id_fk` FOREIGN KEY (`collaboratorSessionId`) REFERENCES `ephemeralSessions`(`id`) ON DELETE cascade
);

INSERT INTO `communities` (`name`, `displayName`, `description`) VALUES
('technology', 'Technology', 'Programming, software, hardware, and the future of tech'),
('design', 'Design', 'UI/UX, graphic design, architecture, and visual thinking'),
('science', 'Science', 'Research, discoveries, and evidence-based discussion'),
('books', 'Books', 'Reading recommendations and literary discussion'),
('general', 'General', 'Everything else — open discussion');
