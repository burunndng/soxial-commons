import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// MOCK DATA & ANTI-VANITY MECHANICS
// ============================================================================

// Mock communities
const mockCommunities = [
  { id: 1, name: "technology", displayName: "Technology", description: "Programming, software, hardware, and the future of tech", createdAt: new Date() },
  { id: 2, name: "design", displayName: "Design", description: "UI/UX, graphic design, architecture, and visual thinking", createdAt: new Date() },
  { id: 3, name: "science", displayName: "Science", description: "Research, discoveries, and evidence-based discussion", createdAt: new Date() },
  { id: 4, name: "books", displayName: "Books", description: "Reading recommendations and literary discussion", createdAt: new Date() },
  { id: 5, name: "general", displayName: "General", description: "Everything else — open discussion", createdAt: new Date() },
];

// Mock ephemeral sessions (rotating pseudonyms)
const pseudonyms = [
  "Thoughtful Badger", "Curious Owl", "Wise Dolphin", "Bright Sparrow", "Keen Fox",
  "Gentle Elephant", "Swift Hawk", "Clever Raven", "Brave Lion", "Serene Turtle",
  "Playful Otter", "Graceful Swan", "Steady Bear", "Nimble Squirrel", "Noble Eagle",
];

let sessionCounter = 1;
const mockSessions = new Map<string, { id: number; pseudonym: string; expiresAt: Date }>();

export async function createEphemeralSession(userId: number, pseudonym?: string) {
  const sessionId = sessionCounter++;
  const assignedPseudonym = pseudonym || pseudonyms[Math.floor(Math.random() * pseudonyms.length)];
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  mockSessions.set(`session_${sessionId}`, {
    id: sessionId,
    pseudonym: assignedPseudonym,
    expiresAt,
  });
  
  return { id: sessionId, pseudonym: assignedPseudonym, expiresAt };
}

// Mock posts
let postCounter = 1;
const mockPosts = new Map<number, any>();

const initialPosts = [
  { communityId: 2, title: "The future of AI in design systems", snippet: "Exploring how AI can help designers create more accessible and inclusive interfaces...", commentCount: 12 },
  { communityId: 1, title: "Why decentralization matters for communities", snippet: "A discussion on how decentralized platforms can empower users and prevent monopolistic control...", commentCount: 28 },
  { communityId: 3, title: "Recent breakthroughs in quantum computing", snippet: "Scientists achieve new milestones in quantum error correction, bringing practical quantum computers closer...", commentCount: 19 },
  { communityId: 4, title: "Favorite fiction books of 2025", snippet: "Let's share and discuss the best fiction books we've read this year. What made them stand out?", commentCount: 45 },
  { communityId: 1, title: "Building accessible web components", snippet: "Best practices for creating components that work for everyone, regardless of ability...", commentCount: 8 },
  { communityId: 5, title: "What's on your mind?", snippet: "Share your thoughts, ideas, and questions with the community.", commentCount: 3 },
];

initialPosts.forEach((post, idx) => {
  mockPosts.set(idx + 1, {
    id: idx + 1,
    communityId: post.communityId,
    title: post.title,
    body: post.snippet,
    sessionId: Math.floor(Math.random() * 5) + 1,
    pseudonym: pseudonyms[Math.floor(Math.random() * pseudonyms.length)],
    score: Math.floor(Math.random() * 100),
    commentCount: post.commentCount,
    createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    isStub: Math.random() < 0.1,
    isCollaborative: Math.random() < 0.15,
    requiresConsensus: Math.random() < 0.05,
  });
});

// Mock votes (hidden until user votes)
const mockVotes = new Map<string, { postId: number; sessionId: number; value: 1 | -1; isHidden: boolean }>();

export async function getCommunities() {
  return mockCommunities;
}

export async function getCommunityByName(name: string) {
  return mockCommunities.find(c => c.name === name);
}

export async function getCommunityById(id: number) {
  return mockCommunities.find(c => c.id === id);
}

export async function getRandomizedFeed(communityId?: number, limit: number = 25) {
  let posts = Array.from(mockPosts.values());
  
  if (communityId) {
    posts = posts.filter(p => p.communityId === communityId);
  }
  
  // Randomize order (serendipity)
  posts = posts.sort(() => Math.random() - 0.5);
  
  return posts.slice(0, limit);
}

export async function getPostById(id: number) {
  return mockPosts.get(id);
}

export async function createPost(communityId: number, sessionId: number, title: string, body?: string, url?: string, isStub?: boolean) {
  const postId = postCounter++;
  mockPosts.set(postId, {
    id: postId,
    communityId,
    sessionId,
    title,
    body: body || "",
    url,
    score: 0,
    commentCount: 0,
    createdAt: new Date(),
    isStub: isStub || false,
    isCollaborative: false,
    requiresConsensus: false,
  });
  return { id: postId };
}

// Mock comments
let commentCounter = 1;
const mockComments = new Map<number, any>();

const initialComments = [
  { postId: 1, body: "Great perspective! I've been thinking about this too.", sessionId: 2, pseudonym: "Curious Owl" },
  { postId: 1, body: "Interesting point, but I'd argue that...", sessionId: 3, pseudonym: "Wise Dolphin" },
  { postId: 2, body: "This is exactly what we need to discuss more.", sessionId: 4, pseudonym: "Bright Sparrow" },
];

initialComments.forEach((comment, idx) => {
  mockComments.set(idx + 1, {
    id: idx + 1,
    postId: comment.postId,
    sessionId: comment.sessionId,
    pseudonym: comment.pseudonym,
    body: comment.body,
    score: Math.floor(Math.random() * 50),
    createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
    parentId: null,
    isSteelmanned: false,
  });
});

export async function getCommentsByPost(postId: number) {
  return Array.from(mockComments.values()).filter(c => c.postId === postId);
}

export async function getCommentById(id: number) {
  return mockComments.get(id);
}

export async function createComment(postId: number, sessionId: number, body: string, parentId?: number) {
  const commentId = commentCounter++;
  mockComments.set(commentId, {
    id: commentId,
    postId,
    sessionId,
    pseudonym: pseudonyms[sessionId % pseudonyms.length],
    body,
    score: 0,
    createdAt: new Date(),
    parentId: parentId || null,
    isSteelmanned: false,
  });
  
  // Increment post comment count
  const post = mockPosts.get(postId);
  if (post) {
    post.commentCount += 1;
  }
  
  return { id: commentId };
}

// Vote mechanics (hidden until user votes)
export async function getPostVoteCount(postId: number, sessionId?: number) {
  const votes = Array.from(mockVotes.values()).filter(v => v.postId === postId);
  const userVoted = sessionId ? votes.some(v => v.sessionId === sessionId) : false;
  
  if (!userVoted && sessionId) {
    // Hide counts until user votes
    return { upvotes: 0, downvotes: 0, userVoted: false };
  }
  
  const upvotes = votes.filter(v => v.value === 1).length;
  const downvotes = votes.filter(v => v.value === -1).length;
  
  return { upvotes, downvotes, userVoted };
}

export async function voteOnPost(postId: number, sessionId: number, value: 1 | -1) {
  const voteKey = `post_${postId}_session_${sessionId}`;
  mockVotes.set(voteKey, { postId, sessionId, value, isHidden: false });
  
  // Update post score
  const post = mockPosts.get(postId);
  if (post) {
    const votes = Array.from(mockVotes.values()).filter(v => v.postId === postId);
    post.score = votes.filter(v => v.value === 1).length - votes.filter(v => v.value === -1).length;
  }
  
  return { success: true };
}

export async function voteOnComment(commentId: number, sessionId: number, value: 1 | -1) {
  const voteKey = `comment_${commentId}_session_${sessionId}`;
  mockVotes.set(voteKey, { postId: commentId, sessionId, value, isHidden: false });
  
  // Update comment score
  const comment = mockComments.get(commentId);
  if (comment) {
    const votes = Array.from(mockVotes.values()).filter(v => v.postId === commentId);
    comment.score = votes.filter(v => v.value === 1).length - votes.filter(v => v.value === -1).length;
  }
  
  return { success: true };
}

// Consensus gates
export async function checkConsensusGate(postId: number) {
  const post = mockPosts.get(postId);
  if (!post) return { requiresConsensus: false, isVisible: true };
  
  return {
    requiresConsensus: post.requiresConsensus,
    isVisible: !post.requiresConsensus,
    opposingEndorsementsNeeded: 2,
    opposingEndorsementsReceived: 0,
  };
}

export async function endorsePost(postId: number, sessionId: number, viewpoint: 'supporting' | 'opposing') {
  const post = mockPosts.get(postId);
  if (post && post.requiresConsensus) {
    if (viewpoint === 'opposing') {
      post.opposingEndorsementsReceived = (post.opposingEndorsementsReceived || 0) + 1;
      if (post.opposingEndorsementsReceived >= 2) {
        post.isVisibleToWider = true;
      }
    }
  }
  return { success: true };
}

// Steelmanning
let steelmanCounter = 1;
const mockSteelmanRequirements = new Map<number, any>();

export async function createSteelmanRequirement(targetCommentId: number, respondingSessionId: number) {
  const requirementId = steelmanCounter++;
  mockSteelmanRequirements.set(requirementId, {
    id: requirementId,
    targetCommentId,
    respondingSessionId,
    isApproved: false,
    createdAt: new Date(),
  });
  return { id: requirementId };
}

export async function submitSteelmanRestatement(requirementId: number, restatement: string) {
  const requirement = mockSteelmanRequirements.get(requirementId);
  if (requirement) {
    requirement.restatement = restatement;
  }
  return { success: true };
}

export async function approveSteelmanRestatement(requirementId: number) {
  const requirement = mockSteelmanRequirements.get(requirementId);
  if (requirement) {
    requirement.isApproved = true;
  }
  return { success: true };
}

// Collaboration
export async function joinPostAsCollaborator(postId: number, sessionId: number) {
  const post = mockPosts.get(postId);
  if (post) {
    post.collaborators = post.collaborators || [];
    if (!post.collaborators.includes(sessionId)) {
      post.collaborators.push(sessionId);
    }
  }
  return { success: true };
}
