"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { type Post, api } from "@/lib/api";
import { formatAge } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ConsensusIndicator } from "./ConsensusIndicator";

interface PostCardProps {
  post: Post;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const { isAuthenticated, login } = useAuth();

  // Initialize vote state from server-provided myVote (vote persistence)
  const [vote, setVote] = useState<{ value: 0 | 1 | -1; score: number }>({
    value: (post.myVote ?? 0) as 0 | 1 | -1,
    score: post.score,
  });
  const [endorsementCount, setEndorsementCount] = useState(
    post.endorsementCount ?? 0
  );

  const handleVote = async (value: 1 | -1, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      await login();
      return;
    }
    const newValue = vote.value === value ? (0 as const) : value;
    const optimistic =
      vote.value === value
        ? vote.score - value
        : vote.value !== 0
        ? vote.score - vote.value + value
        : vote.score + value;

    setVote({ value: newValue, score: optimistic });
    try {
      const res = await api.votePost(post.id, value);
      setVote({ value: newValue, score: res.score });
    } catch {
      setVote({ value: vote.value, score: vote.score });
    }
  };

  const upvoted = vote.value === 1;
  const downvoted = vote.value === -1;
  const hasVoted = vote.value !== 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <Link
        href={`/post/${post.id}`}
        style={{ display: "block", textDecoration: "none" }}
        data-testid={`post-card-${post.id}`}
      >
        <div
          style={{ padding: "18px 0", display: "flex", gap: "14px", alignItems: "flex-start" }}
          onMouseEnter={(e) => {
            (e.currentTarget.parentElement as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.01)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget.parentElement as HTMLElement).style.backgroundColor = "transparent";
          }}
        >
          {/* Vote column */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", flexShrink: 0, paddingTop: "1px" }}>
            <button
              onClick={(e) => handleVote(1, e)}
              data-testid={`upvote-btn-${post.id}`}
              style={{ padding: "3px", color: upvoted ? "var(--accent)" : "var(--text-faint)", transition: "color 100ms", lineHeight: 1 }}
              onMouseEnter={(e) => { if (!upvoted) e.currentTarget.style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { if (!upvoted) e.currentTarget.style.color = "var(--text-faint)"; }}
              title="Upvote"
            >
              <ChevronUp size={15} strokeWidth={upvoted ? 2.5 : 1.5} />
            </button>

            <span
              data-testid={`vote-score-${post.id}`}
              style={{ fontFamily: "var(--font-dm-mono)", fontSize: "10px", lineHeight: 1.4, minWidth: "14px", textAlign: "center", color: hasVoted ? "var(--text-secondary)" : "var(--text-faint)", transition: "color 200ms" }}
            >
              {hasVoted ? vote.score : "·"}
            </span>

            <button
              onClick={(e) => handleVote(-1, e)}
              data-testid={`downvote-btn-${post.id}`}
              style={{ padding: "3px", color: downvoted ? "var(--negative)" : "var(--text-faint)", transition: "color 100ms", lineHeight: 1 }}
              onMouseEnter={(e) => { if (!downvoted) e.currentTarget.style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { if (!downvoted) e.currentTarget.style.color = "var(--text-faint)"; }}
              title="Downvote"
            >
              <ChevronDown size={15} strokeWidth={downvoted ? 2.5 : 1.5} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Tags row */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-dim)" }}>
                {post.communitySlug}
              </span>
              {post.isStub && <span className="stub-badge">stub</span>}
              {post.requiresConsensus && (
                <ConsensusIndicator
                  postId={post.id}
                  requiresConsensus={post.requiresConsensus}
                  endorsementCount={endorsementCount}
                  onUpdated={setEndorsementCount}
                  size="sm"
                />
              )}
            </div>

            {/* Title */}
            <h3 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "17px", fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.4, letterSpacing: "-0.01em", marginBottom: "5px" }}>
              {post.title}
            </h3>

            {/* Excerpt */}
            {post.body && (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "10px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", maxWidth: "72ch" }}>
                {post.body}
              </p>
            )}

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-dm-mono)", fontSize: "10px", color: "var(--text-muted)" }}
                  data-testid={`comment-count-${post.id}`}
                >
                  <MessageCircle size={10} />
                  {post.commentCount}
                </span>
                <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "10px", color: "var(--text-faint)" }}>
                  {formatAge(post.createdAt)}
                </span>
              </div>
              <span
                style={{ fontFamily: "var(--font-dm-mono)", fontSize: "10px", color: "var(--text-faint)", letterSpacing: "0.02em" }}
                data-testid={`post-pseudonym-${post.id}`}
              >
                {post.pseudonym}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
