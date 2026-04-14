/**
 * Serendipity Feed Engine
 * 
 * Implements the "show me things I wouldn't find" discovery model
 * from Are.na, using voting history to detect topic clusters and
 * inject posts from outside the user's familiar clusters.
 */

import type { Post } from "../drizzle/schema";

export interface TopicCluster {
  communityId: number;
  score: number; // Aggregate vote score in this community
}

export interface SerendipityFeedConfig {
  serendipityRatio?: number; // 0.0-1.0, default 0.3 (30%)
  pageSize?: number; // default 25
}

/**
 * Detect topic clusters from user's voting history.
 * Returns communities ordered by engagement (vote count).
 */
export function detectUserClusters(userVotes: any[]): TopicCluster[] {
  const clusterMap = new Map<number, number>();

  // Aggregate votes by community
  userVotes.forEach((vote) => {
    const communityId = vote.post?.communityId;
    if (communityId) {
      clusterMap.set(
        communityId,
        (clusterMap.get(communityId) || 0) + (vote.value === 1 ? 1 : -1)
      );
    }
  });

  // Convert to sorted array
  return Array.from(clusterMap.entries())
    .map(([communityId, score]) => ({ communityId, score }))
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
}

/**
 * Assemble a serendipitous feed by mixing familiar and outside content.
 * 
 * Algorithm:
 * 1. Identify user's topic clusters from voting history
 * 2. Split posts into "familiar" (in clusters) and "outside" (not in clusters)
 * 3. Shuffle each group independently
 * 4. Sample from each group according to serendipityRatio
 * 5. Shuffle the combined result
 */
export function assembleSerendipityFeed(
  allPosts: Post[],
  userClusters: TopicCluster[],
  config: SerendipityFeedConfig = {}
): Post[] {
  const { serendipityRatio = 0.3, pageSize = 25 } = config;

  if (userClusters.length === 0) {
    // No voting history: return fully randomized feed
    return shuffle(allPosts).slice(0, pageSize);
  }

  const familiarCommunityIds = userClusters.map((c) => c.communityId);

  // Split posts into familiar and outside
  const familiar = allPosts.filter((p) =>
    familiarCommunityIds.includes(p.communityId)
  );
  const outside = allPosts.filter(
    (p) => !familiarCommunityIds.includes(p.communityId)
  );

  // Calculate sample sizes
  const outsideSize = Math.floor(pageSize * serendipityRatio);
  const familiarSize = pageSize - outsideSize;

  // Sample from each group
  const familiarSample = shuffle(familiar).slice(0, familiarSize);
  const outsideSample = shuffle(outside).slice(0, outsideSize);

  // Combine and shuffle
  return shuffle([...familiarSample, ...outsideSample]);
}

/**
 * Simple Fisher-Yates shuffle.
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Detect opposing viewpoint clusters for consensus gates.
 * 
 * Simple approach: users who vote opposite on the same posts
 * form opposing clusters.
 */
export function detectOpposingClusters(
  allVotes: any[],
  postId: number
): { pro: Set<number>; con: Set<number> } {
  const pro = new Set<number>();
  const con = new Set<number>();

  const postVotes = allVotes.filter((v) => v.postId === postId);

  postVotes.forEach((vote) => {
    if (vote.value > 0) {
      pro.add(vote.sessionId);
    } else if (vote.value < 0) {
      con.add(vote.sessionId);
    }
  });

  return { pro, con };
}

/**
 * Check if a post has sufficient cross-cluster consensus.
 * Requires at least one endorsement from each opposing cluster.
 */
export function hasConsensusGate(
  postVotes: any[],
  postId: number = 0,
  requiredClusters: number = 2
): boolean {
  const clusters = detectOpposingClusters(postVotes, postId);
  const hasProVotes = clusters.pro.size > 0;
  const hasConVotes = clusters.con.size > 0;

  return hasProVotes && hasConVotes;
}
