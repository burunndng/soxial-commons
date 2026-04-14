"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, MessageCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatAge } from "@/lib/utils";
import { CommentTree } from "@/components/CommentTree";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;
  const { isAuthenticated } = useAuth();

  const [vote, setVote] = useState<{ value: 1 | -1 | 0; score: number | null }>({ value: 0, score: null });

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => api.post(postId),
    enabled: !!postId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => api.comments(postId),
    enabled: !!postId,
  });

  const handleVote = async (value: 1 | -1) => {
    if (!isAuthenticated || !post) return;
    const newValue = vote.value === value ? (0 as const) : value;
    const currentScore = vote.score ?? post.score;
    const optimistic =
      vote.value === value
        ? currentScore - value
        : vote.value !== 0
        ? currentScore - vote.value + value
        : currentScore + value;
    setVote({ value: newValue, score: optimistic });
    try {
      const res = await api.votePost(post.id, value);
      setVote({ value: newValue, score: res.score });
    } catch {
      setVote({ value: vote.value, score: vote.score });
    }
  };

  if (postLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
        <div className="container-narrow" style={{ paddingTop: "48px" }}>
          <div style={{ color: "var(--text-faint)", fontFamily: "var(--font-dm-mono)", fontSize: "11px" }}>
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
        <div className="container-narrow" style={{ paddingTop: "48px" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "12px" }}>Post not found.</p>
          <button
            onClick={() => router.back()}
            style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--font-dm-sans)" }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const upvoted = vote.value === 1;
  const downvoted = vote.value === -1;
  const hasVoted = vote.value !== 0;
  const displayScore = vote.score ?? post.score;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
      <div
        className="container-narrow"
        style={{ paddingTop: "32px", paddingBottom: "80px" }}
      >
        {/* Back */}
        <button
          onClick={() => router.back()}
          data-testid="post-back-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-dm-mono)",
            fontSize: "10px",
            letterSpacing: "0.04em",
            marginBottom: "36px",
            padding: 0,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <ChevronLeft size={12} />
          Back
        </button>

        {/* Post */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "36px",
            marginBottom: "40px",
          }}
        >
          {/* Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "9px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent-dim)",
              }}
              data-testid="post-community"
            >
              {post.communitySlug}
            </span>
            {post.isStub && <span className="stub-badge">stub</span>}
            {post.requiresConsensus && (
              <span className="consensus-badge">⊙ gate</span>
            )}
            <span
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "10px",
                color: "var(--text-faint)",
                marginLeft: "auto",
              }}
            >
              {formatAge(post.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ marginBottom: "20px" }} data-testid="post-title">
            {post.title}
          </h1>

          {/* Body */}
          {post.body && (
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "15px",
                lineHeight: 1.8,
                marginBottom: "28px",
                maxWidth: "68ch",
              }}
              data-testid="post-body"
            >
              {post.body}
            </p>
          )}

          {/* URL */}
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                fontFamily: "var(--font-dm-mono)",
                fontSize: "11px",
                color: "var(--accent)",
                marginBottom: "20px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {post.url}
            </a>
          )}

          {/* Actions */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => handleVote(1)}
                data-testid="post-upvote-btn"
                style={{
                  padding: "4px",
                  color: upvoted ? "var(--accent)" : "var(--text-faint)",
                  transition: "color 100ms",
                }}
              >
                <ChevronUp size={16} strokeWidth={upvoted ? 2.5 : 1.5} />
              </button>
              <span
                data-testid="post-vote-score"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "12px",
                  color: hasVoted ? "var(--text-secondary)" : "var(--text-faint)",
                  minWidth: "16px",
                  textAlign: "center",
                }}
              >
                {hasVoted ? displayScore : "·"}
              </span>
              <button
                onClick={() => handleVote(-1)}
                data-testid="post-downvote-btn"
                style={{
                  padding: "4px",
                  color: downvoted ? "var(--negative)" : "var(--text-faint)",
                  transition: "color 100ms",
                }}
              >
                <ChevronDown size={16} strokeWidth={downvoted ? 2.5 : 1.5} />
              </button>
            </div>

            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "var(--font-dm-mono)",
                fontSize: "11px",
                color: "var(--text-faint)",
              }}
            >
              <MessageCircle size={11} />
              {comments.length}
            </span>

            <span
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "10px",
                color: "var(--text-faint)",
                marginLeft: "auto",
                letterSpacing: "0.02em",
              }}
              data-testid="post-author"
            >
              {post.pseudonym}
            </span>
          </div>
        </motion.div>

        {/* Comments */}
        {commentsLoading ? (
          <p
            style={{
              color: "var(--text-faint)",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "11px",
            }}
          >
            Loading…
          </p>
        ) : (
          <CommentTree comments={comments} postId={postId} />
        )}
      </div>
    </div>
  );
}
