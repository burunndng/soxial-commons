import { describe, it, expect } from "vitest";
import {
  detectUserClusters,
  assembleSerendipityFeed,
  detectOpposingClusters,
  hasConsensusGate,
} from "./serendipity";
import type { Post } from "../drizzle/schema";

describe("Serendipity Feed Engine", () => {
  describe("detectUserClusters", () => {
    it("should identify user's topic clusters from voting history", () => {
      const votes = [
        { post: { communityId: 1 }, value: 1 },
        { post: { communityId: 1 }, value: 1 },
        { post: { communityId: 2 }, value: 1 },
        { post: { communityId: 3 }, value: -1 },
      ];

      const clusters = detectUserClusters(votes);

      expect(clusters.length).toBe(3);
      expect(clusters[0]?.communityId).toBe(1); // Highest score
      expect(clusters[0]?.score).toBe(2);
    });

    it("should return empty array for no votes", () => {
      const clusters = detectUserClusters([]);
      expect(clusters.length).toBe(0);
    });

    it("should aggregate positive and negative votes correctly", () => {
      const votes = [
        { post: { communityId: 1 }, value: 1 },
        { post: { communityId: 1 }, value: -1 },
        { post: { communityId: 1 }, value: 1 },
      ];

      const clusters = detectUserClusters(votes);

      expect(clusters[0]?.score).toBe(1); // Net score
    });
  });

  describe("assembleSerendipityFeed", () => {
    const mockPosts: Post[] = [
      {
        id: 1,
        communityId: 1,
        title: "Post 1",
        body: "Content 1",
        sessionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        commentCount: 0,
        score: 5,
        isStub: false,
        requiresConsensus: false,
      },
      {
        id: 2,
        communityId: 1,
        title: "Post 2",
        body: "Content 2",
        sessionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        commentCount: 0,
        score: 3,
        isStub: false,
        requiresConsensus: false,
      },
      {
        id: 3,
        communityId: 2,
        title: "Post 3",
        body: "Content 3",
        sessionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        commentCount: 0,
        score: 2,
        isStub: false,
        requiresConsensus: false,
      },
      {
        id: 4,
        communityId: 3,
        title: "Post 4",
        body: "Content 4",
        sessionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        commentCount: 0,
        score: 1,
        isStub: false,
        requiresConsensus: false,
      },
    ];

    it("should return randomized feed when no clusters", () => {
      const feed = assembleSerendipityFeed(mockPosts, [], { pageSize: 4 });

      expect(feed.length).toBeLessThanOrEqual(4);
      expect(feed.every((p) => mockPosts.some((mp) => mp.id === p.id))).toBe(
        true
      );
    });

    it("should mix familiar and outside posts according to serendipity ratio", () => {
      const clusters = [{ communityId: 1, score: 2 }];
      const feed = assembleSerendipityFeed(mockPosts, clusters, {
        serendipityRatio: 0.5,
        pageSize: 4,
      });

      expect(feed.length).toBeLessThanOrEqual(4);

      // Should have mix of community 1 and others
      const community1Posts = feed.filter((p) => p.communityId === 1);
      const otherPosts = feed.filter((p) => p.communityId !== 1);

      expect(community1Posts.length).toBeGreaterThan(0);
      expect(otherPosts.length).toBeGreaterThan(0);
    });

    it("should respect page size limit", () => {
      const clusters = [{ communityId: 1, score: 2 }];
      const feed = assembleSerendipityFeed(mockPosts, clusters, {
        pageSize: 2,
      });

      expect(feed.length).toBeLessThanOrEqual(2);
    });

    it("should inject serendipity at specified ratio", () => {
      const clusters = [{ communityId: 1, score: 5 }];
      const feed = assembleSerendipityFeed(mockPosts, clusters, {
        serendipityRatio: 0.3,
        pageSize: 10,
      });

      // Approximately 30% should be from outside clusters
      const outsidePosts = feed.filter((p) => p.communityId !== 1);
      const ratio = outsidePosts.length / feed.length;

      // Allow some variance due to randomness
      expect(ratio).toBeGreaterThanOrEqual(0.2);
      expect(ratio).toBeLessThanOrEqual(0.5);
    });
  });

  describe("detectOpposingClusters", () => {
    it("should identify pro and con voters", () => {
      const votes = [
        { postId: 1, sessionId: 1, value: 1 },
        { postId: 1, sessionId: 2, value: 1 },
        { postId: 1, sessionId: 3, value: -1 },
        { postId: 1, sessionId: 4, value: -1 },
      ];

      const clusters = detectOpposingClusters(votes, 1);

      expect(clusters.pro.size).toBe(2);
      expect(clusters.con.size).toBe(2);
      expect(clusters.pro.has(1)).toBe(true);
      expect(clusters.con.has(3)).toBe(true);
    });

    it("should ignore zero votes", () => {
      const votes = [
        { postId: 1, sessionId: 1, value: 1 },
        { postId: 1, sessionId: 2, value: 0 },
        { postId: 1, sessionId: 3, value: -1 },
      ];

      const clusters = detectOpposingClusters(votes, 1);

      expect(clusters.pro.size).toBe(1);
      expect(clusters.con.size).toBe(1);
      expect(clusters.pro.has(2)).toBe(false);
    });
  });

  describe("hasConsensusGate", () => {
    it("should return true when both pro and con votes exist", () => {
      const votes = [
        { postId: 1, sessionId: 1, value: 1 },
        { postId: 1, sessionId: 2, value: -1 },
      ];

      const result = hasConsensusGate(votes, 1);

      expect(result).toBe(true);
    });

    it("should return false when only pro votes exist", () => {
      const votes = [
        { postId: 1, sessionId: 1, value: 1 },
        { postId: 1, sessionId: 2, value: 1 },
      ];

      const result = hasConsensusGate(votes, 1);

      expect(result).toBe(false);
    });

    it("should return false when only con votes exist", () => {
      const votes = [
        { postId: 1, sessionId: 1, value: -1 },
        { postId: 1, sessionId: 2, value: -1 },
      ];

      const result = hasConsensusGate(votes, 1);

      expect(result).toBe(false);
    });

    it("should return false when no votes exist", () => {
      const result = hasConsensusGate([], 1);

      expect(result).toBe(false);
    });
  });
});
