import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Ephemeral Sessions
  sessions: router({
    create: protectedProcedure
      .input(z.object({ pseudonym: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return db.createEphemeralSession(ctx.user.id, input.pseudonym);
      }),
  }),

  // Communities
  communities: router({
    list: publicProcedure.query(async () => {
      return db.getCommunities();
    }),
    
    getByName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return db.getCommunityByName(input.name);
      }),
  }),

  // Posts
  posts: router({
    create: protectedProcedure
      .input(z.object({
        communityId: z.number(),
        sessionId: z.number(),
        title: z.string().min(1).max(300),
        body: z.string().optional(),
        url: z.string().url().optional(),
        isStub: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createPost(
          input.communityId,
          input.sessionId,
          input.title,
          input.body,
          input.url,
          input.isStub
        );
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPostById(input.id);
      }),
    
    getFeed: publicProcedure
      .input(z.object({
        communityId: z.number().optional(),
        limit: z.number().default(25),
      }))
      .query(async ({ input }) => {
        return db.getRandomizedFeed(input.communityId, input.limit);
      }),
  }),

  // Post Votes (Hidden until user votes)
  postVotes: router({
    vote: protectedProcedure
      .input(z.object({
        postId: z.number(),
        sessionId: z.number(),
        value: z.enum(['1', '-1']),
      }))
      .mutation(async ({ input }) => {
        const voteValue = input.value === '1' ? 1 : -1;
        return db.voteOnPost(input.postId, input.sessionId, voteValue);
      }),
    
    getCount: publicProcedure
      .input(z.object({
        postId: z.number(),
        sessionId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return db.getPostVoteCount(input.postId, input.sessionId);
      }),
  }),

  // Comments
  comments: router({
    create: protectedProcedure
      .input(z.object({
        postId: z.number(),
        sessionId: z.number(),
        body: z.string().min(1),
        parentId: z.number().optional(),
        isSteelmanned: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createComment(input.postId, input.sessionId, input.body, input.parentId);
      }),
    
    getByPost: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return db.getCommentsByPost(input.postId);
      }),
  }),

  // Comment Votes (Hidden until user votes)
  commentVotes: router({
    vote: protectedProcedure
      .input(z.object({
        commentId: z.number(),
        sessionId: z.number(),
        value: z.enum(['1', '-1']),
      }))
      .mutation(async ({ input }) => {
        const voteValue = input.value === '1' ? 1 : -1;
        return db.voteOnComment(input.commentId, input.sessionId, voteValue);
      }),
  }),

  // Consensus Gates
  consensusGates: router({
    check: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return db.checkConsensusGate(input.postId);
      }),
    
    endorse: protectedProcedure
      .input(z.object({
        postId: z.number(),
        sessionId: z.number(),
        viewpoint: z.enum(['supporting', 'opposing']),
      }))
      .mutation(async ({ input }) => {
        return db.endorsePost(input.postId, input.sessionId, input.viewpoint);
      }),
  }),

  // Steelmanning
  steelmanning: router({
    createRequirement: protectedProcedure
      .input(z.object({
        targetCommentId: z.number(),
        respondingSessionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return db.createSteelmanRequirement(input.targetCommentId, input.respondingSessionId);
      }),
    
    submitRestatement: protectedProcedure
      .input(z.object({
        requirementId: z.number(),
        restatement: z.string(),
      }))
      .mutation(async ({ input }) => {
        return db.submitSteelmanRestatement(input.requirementId, input.restatement);
      }),
    
    approve: protectedProcedure
      .input(z.object({ requirementId: z.number() }))
      .mutation(async ({ input }) => {
        return db.approveSteelmanRestatement(input.requirementId);
      }),
  }),

  // Collaboration
  collaboration: router({
    joinAsCoauthor: protectedProcedure
      .input(z.object({
        postId: z.number(),
        sessionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return db.joinPostAsCollaborator(input.postId, input.sessionId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
