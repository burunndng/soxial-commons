"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { type Comment, api } from "@/lib/api";
import { formatAge } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { SteelmanModal } from "./SteelmanModal";
import { ReportButton } from "./ReportButton";

interface CommentNodeProps {
  comment: Comment;
  replies: Comment[];
  allComments: Comment[];
  depth?: number;
  threadPseudonym?: string | null;
}

function CommentNode({
  comment,
  replies,
  allComments,
  depth = 0,
  threadPseudonym,
}: CommentNodeProps) {
  const { isAuthenticated, login } = useAuth();
  const [vote, setVote] = useState<{ value: 1 | -1 | 0; score: number }>({
    value: 0,
    score: comment.score,
  });
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [steelmanTarget, setSteelmanTarget] = useState<Comment | null>(null);
  const [localReplies, setLocalReplies] = useState<Comment[]>([]);

  const handleVote = async (value: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      await login();
      return;
    }
    const newValue = vote.value === value ? (0 as const) : value;
    const optimisticScore =
      vote.value === value
        ? vote.score - value
        : vote.value !== 0
        ? vote.score - vote.value + value
        : vote.score + value;
    setVote({ value: newValue, score: optimisticScore });
    try {
      const res = await api.voteComment(comment.id, value);
      setVote({ value: newValue, score: res.score });
    } catch {
      setVote({ value: vote.value, score: vote.score });
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await api.createComment(comment.postId, {
        body: replyText,
        parentId: comment.id,
      });
      const newComment: Comment = {
        id: res.id,
        postId: comment.postId,
        pseudonym: threadPseudonym || "you",
        body: replyText,
        score: 0,
        parentId: comment.id,
        isSteelmanned: false,
        createdAt: new Date().toISOString(),
      };
      setLocalReplies((p) => [...p, newComment]);
      setReplyText("");
      setReplyOpen(false);
    } catch {
      // handle error
    }
  };

  const upvoted = vote.value === 1;
  const downvoted = vote.value === -1;
  const hasVoted = vote.value !== 0;
  const allReplies = [
    ...replies,
    ...localReplies.filter((r) => r.parentId === comment.id),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div
        style={{
          paddingLeft: depth > 0 ? "20px" : "0",
          borderLeft:
            depth > 0 ? "1px solid var(--border-subtle)" : "none",
          marginLeft: depth > 0 ? "16px" : "0",
        }}
      >
        {/* Author row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: "10px",
              color: "var(--text-faint)",
              letterSpacing: "0.02em",
            }}
          >
            {comment.pseudonym}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: "10px",
              color: "var(--text-faint)",
            }}
          >
            {formatAge(comment.createdAt)}
          </span>
          {comment.isSteelmanned && (
            <span
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "9px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--accent-dim)",
                padding: "1px 6px",
                border: "1px solid var(--accent-dim)",
              }}
            >
              steelmanned
            </span>
          )}
        </div>

        {/* Body */}
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "10px",
            maxWidth: "70ch",
          }}
        >
          {comment.body}
        </p>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onClick={(e) => handleVote(1, e)}
              data-testid={`comment-upvote-${comment.id}`}
              style={{
                padding: "2px",
                color: upvoted ? "var(--accent)" : "var(--text-faint)",
                transition: "color 100ms",
              }}
            >
              <ChevronUp size={13} strokeWidth={upvoted ? 2.5 : 1.5} />
            </button>
            <span
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "10px",
                color: hasVoted ? "var(--text-secondary)" : "var(--text-faint)",
                minWidth: "12px",
                textAlign: "center",
              }}
            >
              {hasVoted ? vote.score : "·"}
            </span>
            <button
              onClick={(e) => handleVote(-1, e)}
              data-testid={`comment-downvote-${comment.id}`}
              style={{
                padding: "2px",
                color: downvoted ? "var(--negative)" : "var(--text-faint)",
                transition: "color 100ms",
              }}
            >
              <ChevronDown size={13} strokeWidth={downvoted ? 2.5 : 1.5} />
            </button>
          </div>

          {isAuthenticated && depth < 2 && (
            <>
              <button
                onClick={() => setReplyOpen((o) => !o)}
                data-testid={`reply-btn-${comment.id}`}
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.04em",
                  color: "var(--text-faint)",
                  transition: "color 120ms",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-secondary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-faint)")
                }
              >
                reply
              </button>
              <button
                onClick={() => setSteelmanTarget(comment)}
                data-testid={`steelman-btn-${comment.id}`}
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.04em",
                  color: "var(--text-faint)",
                  transition: "color 120ms",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--accent-dim)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-faint)")
                }
                title="Restate the opposing view before replying"
              >
                steelman
              </button>
              <ReportButton targetId={comment.id} targetType="comment" />
            </>
          )}
        </div>

        {/* Reply form */}
        <AnimatePresence>
          {replyOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: "16px", overflow: "hidden" }}
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add your reply…"
                rows={3}
                data-testid={`reply-input-${comment.id}`}
                style={{ marginBottom: "8px", resize: "vertical" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <button
                  onClick={() => setReplyOpen(false)}
                  style={{
                    padding: "5px 12px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  data-testid={`reply-submit-${comment.id}`}
                  style={{
                    padding: "5px 14px",
                    fontSize: "12px",
                    border: "1px solid var(--accent)",
                    color: "var(--accent)",
                    fontFamily: "var(--font-dm-sans)",
                    opacity: replyText.trim() ? 1 : 0.4,
                  }}
                >
                  Reply
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nested replies */}
        {allReplies.map((reply) => (
          <CommentNode
            key={reply.id}
            comment={reply}
            replies={allComments.filter((c) => c.parentId === reply.id)}
            allComments={allComments}
            depth={depth + 1}
            threadPseudonym={threadPseudonym}
          />
        ))}
      </div>

      {/* Steelman modal */}
      {steelmanTarget && (
        <SteelmanModal
          comment={steelmanTarget}
          onClose={() => setSteelmanTarget(null)}
          onSubmit={() => {
            setSteelmanTarget(null);
            setReplyOpen(true);
          }}
        />
      )}
    </motion.div>
  );
}

interface CommentTreeProps {
  comments: Comment[];
  postId: string;
  threadPseudonym?: string | null;
}

export function CommentTree({ comments, postId, threadPseudonym }: CommentTreeProps) {
  const { isAuthenticated, login } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const topLevel = [...comments, ...localComments].filter((c) => !c.parentId);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    if (!isAuthenticated) {
      await login();
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createComment(postId, { body: newComment });
      setLocalComments((p) => [
        ...p,
        {
          id: res.id,
          postId,
          pseudonym: threadPseudonym || "you",
          body: newComment,
          score: 0,
          parentId: null,
          isSteelmanned: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewComment("");
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Composer */}
      <div style={{ marginBottom: "40px" }}>
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "16px",
          }}
        >
          Discussion · {topLevel.length + comments.filter((c) => c.parentId).length}
        </p>

        {isAuthenticated ? (
          <div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add to the discussion…"
              rows={4}
              data-testid="comment-input"
              style={{ marginBottom: "10px", resize: "vertical" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                onClick={() => setNewComment("")}
                style={{
                  padding: "7px 14px",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                data-testid="comment-submit-btn"
                style={{
                  padding: "7px 18px",
                  fontSize: "12px",
                  border: "1px solid var(--accent)",
                  color: newComment.trim() ? "var(--accent)" : "var(--text-faint)",
                  borderColor: newComment.trim() ? "var(--accent)" : "var(--border-c)",
                  fontFamily: "var(--font-dm-sans)",
                  opacity: newComment.trim() && !submitting ? 1 : 0.5,
                }}
              >
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "16px",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                fontFamily: "var(--font-dm-mono)",
              }}
            >
              Enter to join the discussion.
            </span>
            <button
              onClick={login}
              data-testid="comment-login-btn"
              style={{
                padding: "6px 14px",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                fontSize: "12px",
                fontFamily: "var(--font-dm-sans)",
                flexShrink: 0,
              }}
            >
              Enter
            </button>
          </div>
        )}
      </div>

      {/* Comment list */}
      {topLevel.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "11px",
            color: "var(--text-faint)",
            padding: "16px 0",
          }}
        >
          No replies yet.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0",
          }}
        >
          {topLevel.map((comment) => (
            <div
              key={comment.id}
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                padding: "20px 0",
              }}
            >
              <CommentNode
                comment={comment}
                replies={comments.filter((c) => c.parentId === comment.id)}
                allComments={comments}
                depth={0}
                threadPseudonym={threadPseudonym}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
