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
};
