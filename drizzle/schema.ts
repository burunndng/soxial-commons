import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Ephemeral sessions — rotating pseudonyms per session/thread
 * No persistent profiles, no karma, no follower counts
 */
export const ephemeralSessions = mysqlTable("ephemeralSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  pseudonym: varchar("pseudonym", { length: 64 }).notNull(),
  sessionToken: varchar("sessionToken", { length: 256 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EphemeralSession = typeof ephemeralSessions.$inferSelect;
export type InsertEphemeralSession = typeof ephemeralSessions.$inferInsert;

/**
 * Communities — topic rooms, not user profiles
 */
export const communities = mysqlTable("communities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = typeof communities.$inferInsert;

/**
 * Posts — ideas to be discussed and collaborated on
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  communityId: int("communityId").notNull().references(() => communities.id, { onDelete: "cascade" }),
  authorSessionId: int("authorSessionId").notNull().references(() => ephemeralSessions.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body"),
  url: varchar("url", { length: 2048 }),
  
  // Collaboration mechanics
  isStub: boolean("isStub").default(false).notNull(), // Incomplete post for co-authoring
  isCollaborative: boolean("isCollaborative").default(false).notNull(), // Open for co-authors
  
  // Consensus mechanics
  requiresConsensus: boolean("requiresConsensus").default(false).notNull(), // Needs opposing endorsements
  opposingEndorsementsNeeded: int("opposingEndorsementsNeeded").default(0).notNull(),
  opposingEndorsementsReceived: int("opposingEndorsementsReceived").default(0).notNull(),
  isVisibleToWider: boolean("isVisibleToWider").default(true).notNull(), // Consensus gate passed
  
  // Temporal mechanics
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Temporal decay — post expires after time
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Post votes — on ideas, not authors
 * Vote counts hidden until user votes
 */
export const postVotes = mysqlTable("postVotes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  sessionId: int("sessionId").notNull().references(() => ephemeralSessions.id, { onDelete: "cascade" }),
  value: mysqlEnum("value", ["1", "-1"]).notNull(),
  isHidden: boolean("isHidden").default(true).notNull(), // Hidden until user votes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostVote = typeof postVotes.$inferSelect;
export type InsertPostVote = typeof postVotes.$inferInsert;

/**
 * Comments — threaded discussion with forced steelmanning
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorSessionId: int("authorSessionId").notNull().references(() => ephemeralSessions.id, { onDelete: "cascade" }),
  parentId: int("parentId").references((): any => comments.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  isSteelmanned: boolean("isSteelmanned").default(false).notNull(), // Restatement of opposing view
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = any;
export type InsertComment = any;

/**
 * Comment votes — on ideas in discussion
 */
export const commentVotes = mysqlTable("commentVotes", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull().references(() => comments.id, { onDelete: "cascade" }),
  sessionId: int("sessionId").notNull().references(() => ephemeralSessions.id, { onDelete: "cascade" }),
  value: mysqlEnum("value", ["1", "-1"]).notNull(),
  isHidden: boolean("isHidden").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentVote = typeof commentVotes.$inferSelect;
export type InsertCommentVote = typeof commentVotes.$inferInsert;

/**
 * Steelmanning requirements — before negative response, restate opposing view
 */
export const steelmanRequirements = mysqlTable("steelmanRequirements", {
  id: int("id").autoincrement().primaryKey(),
  targetCommentId: int("targetCommentId").notNull().references(() => comments.id, { onDelete: "cascade" }),
  respondingSessionId: int("respondingSessionId").notNull().references(() => ephemeralSessions.id, { onDelete: "cascade" }),
  requiredRestatement: text("requiredRestatement"),
  isApproved: boolean("isApproved").default(false).notNull(),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SteelmanRequirement = typeof steelmanRequirements.$inferSelect;
export type InsertSteelmanRequirement = typeof steelmanRequirements.$inferInsert;

/**
 * Consensus endorsements — opposing viewpoints endorse posts
 */
export const consensusEndorsements = mysqlTable("consensusEndorsements", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  endorsingSessionId: int("endorsingSessionId").notNull().references(() => ephemeralSessions.id, { onDelete: "cascade" }),
  viewpoint: mysqlEnum("viewpoint", ["supporting", "opposing"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConsensusEndorsement = typeof consensusEndorsements.$inferSelect;
export type InsertConsensusEndorsement = typeof consensusEndorsements.$inferInsert;

/**
 * Post collaborators — co-authors on incomplete posts
 */
export const postCollaborators = mysqlTable("postCollaborators", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  collaboratorSessionId: int("collaboratorSessionId").notNull().references(() => ephemeralSessions.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type PostCollaborator = typeof postCollaborators.$inferSelect;
export type InsertPostCollaborator = typeof postCollaborators.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(ephemeralSessions),
}));

export const ephemeralSessionsRelations = relations(ephemeralSessions, ({ one, many }) => ({
  user: one(users, { fields: [ephemeralSessions.userId], references: [users.id] }),
  posts: many(posts),
  comments: many(comments),
  postVotes: many(postVotes),
  commentVotes: many(commentVotes),
  collaborations: many(postCollaborators),
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  community: one(communities, { fields: [posts.communityId], references: [communities.id] }),
  author: one(ephemeralSessions, { fields: [posts.authorSessionId], references: [ephemeralSessions.id] }),
  votes: many(postVotes),
  comments: many(comments),
  collaborators: many(postCollaborators),
  endorsements: many(consensusEndorsements),
}));

export const postVotesRelations = relations(postVotes, ({ one }) => ({
  post: one(posts, { fields: [postVotes.postId], references: [posts.id] }),
  session: one(ephemeralSessions, { fields: [postVotes.sessionId], references: [ephemeralSessions.id] }),
}));

export const commentsRelations: any = relations(comments, ({ one, many }: any): any => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(ephemeralSessions, { fields: [comments.authorSessionId], references: [ephemeralSessions.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id] }),
  replies: many(comments),
  votes: many(commentVotes),
  steelmanRequirements: many(steelmanRequirements),
}));

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
  comment: one(comments, { fields: [commentVotes.commentId], references: [comments.id] }),
  session: one(ephemeralSessions, { fields: [commentVotes.sessionId], references: [ephemeralSessions.id] }),
}));

export const steelmanRequirementsRelations = relations(steelmanRequirements, ({ one }) => ({
  targetComment: one(comments, { fields: [steelmanRequirements.targetCommentId], references: [comments.id] }),
  respondingSession: one(ephemeralSessions, { fields: [steelmanRequirements.respondingSessionId], references: [ephemeralSessions.id] }),
}));

export const consensusEndorsementsRelations = relations(consensusEndorsements, ({ one }) => ({
  post: one(posts, { fields: [consensusEndorsements.postId], references: [posts.id] }),
  endorsingSession: one(ephemeralSessions, { fields: [consensusEndorsements.endorsingSessionId], references: [ephemeralSessions.id] }),
}));

export const postCollaboratorsRelations = relations(postCollaborators, ({ one }) => ({
  post: one(posts, { fields: [postCollaborators.postId], references: [posts.id] }),
  collaborator: one(ephemeralSessions, { fields: [postCollaborators.collaboratorSessionId], references: [ephemeralSessions.id] }),
}));
