import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const client = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export type Post = {
  id: string;
  communitySlug: string;
  pseudonym: string;
  title: string;
  body: string;
  url?: string;
  score: number;
  commentCount: number;
  isStub: boolean;
  requiresConsensus: boolean;
  createdAt: string;
  // vote persistence
  myVote?: 0 | 1 | -1;
  // consensus gate
  endorsementCount?: number;
  // report/jury
  reportCount?: number;
  hasJuryCase?: boolean;
  juryStatus?: string | null;
};

export type Comment = {
  id: string;
  postId: string;
  pseudonym: string;
  body: string;
  score: number;
  parentId: string | null;
  isSteelmanned: boolean;
  createdAt: string;
};

export type Community = {
  slug: string;
  name: string;
  description: string;
};

export type ConsensusState = {
  status: "pending" | "partial" | "open";
  endorsed: number;
  required: number;
  hasEndorsed: boolean;
};

export type ReportStatus = {
  reportCount: number;
  hasReported: boolean;
  hasJuryCase: boolean;
  juryStatus: Record<string, unknown> | null;
};

export const api = {
  feed: (params?: { community?: string; limit?: number }) =>
    client.get<Post[]>("/api/feed", { params }).then((r) => r.data),

  post: (id: string) =>
    client.get<Post>(`/api/posts/${id}`).then((r) => r.data),

  createPost: (data: {
    communitySlug: string;
    title: string;
    body?: string;
    url?: string;
    isStub?: boolean;
    requiresConsensus?: boolean;
  }) => client.post<{ id: string }>("/api/posts", data).then((r) => r.data),

  comments: (postId: string) =>
    client.get<Comment[]>(`/api/posts/${postId}/comments`).then((r) => r.data),

  createComment: (postId: string, data: { body: string; parentId?: string }) =>
    client.post<{ id: string }>(`/api/posts/${postId}/comments`, data).then((r) => r.data),

  votePost: (postId: string, value: 1 | -1) =>
    client.post<{ success: boolean; score: number }>(`/api/posts/${postId}/vote`, { value }).then((r) => r.data),

  voteComment: (commentId: string, value: 1 | -1) =>
    client.post<{ success: boolean; score: number }>(`/api/comments/${commentId}/vote`, { value }).then((r) => r.data),

  communities: () =>
    client.get<Community[]>("/api/communities").then((r) => r.data),

  community: (slug: string) =>
    client.get<Community>(`/api/communities/${slug}`).then((r) => r.data),

  myVote: (postId: string) =>
    client.get<{ voted: boolean; value: number; score: number | null }>(`/api/posts/${postId}/my-vote`).then((r) => r.data),

  // Consensus
  consensus: (postId: string) =>
    client.get<ConsensusState>(`/api/posts/${postId}/consensus`).then((r) => r.data),

  endorse: (postId: string) =>
    client.post<{ success: boolean; endorsed: number; required: number }>(`/api/posts/${postId}/endorse`).then((r) => r.data),

  // Reports
  reportPost: (postId: string, reason: string, details?: string) =>
    client.post<{ success: boolean; reportCount: number; juryTriggered: boolean }>(`/api/posts/${postId}/report`, { reason, details }).then((r) => r.data),

  reportComment: (commentId: string, reason: string, details?: string) =>
    client.post<{ success: boolean; reportCount: number }>(`/api/comments/${commentId}/report`, { reason, details }).then((r) => r.data),

  reportStatus: (postId: string) =>
    client.get<ReportStatus>(`/api/posts/${postId}/report-status`).then((r) => r.data),

  // Per-thread pseudonym
  threadPseudonym: (postId: string) =>
    client.get<{ pseudonym: string }>(`/api/posts/${postId}/thread-pseudonym`).then((r) => r.data),
};
