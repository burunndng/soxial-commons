import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MessageCircle, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import SteelmanModal from "@/components/SteelmanModal";

export default function PostDetail() {
  const [match, params] = useRoute("/post/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [steelmanTarget, setSteelmanTarget] = useState<number | null>(null);

  if (!match) return null;

  const postId = parseInt(params?.id as string);

  const { data: post, isLoading: postLoading } = trpc.posts.getById.useQuery({ id: postId });
  const { data: comments = [], isLoading: commentsLoading } = trpc.comments.getByPost.useQuery({ postId });

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const hours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const handleVote = (itemId: number, value: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setUserVotes((prev) => ({ ...prev, [itemId]: prev[itemId] === value ? 0 : value }));
  };

  const hasVoted = (id: number) => id in userVotes && userVotes[id] !== 0;

  if (postLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
        <div className="container" style={{ paddingTop: "40px" }}>
          <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
        <div className="container" style={{ paddingTop: "40px" }}>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px", marginBottom: "12px" }}>
            Post not found.
          </p>
          <button
            onClick={() => setLocation("/")}
            style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--font-ui)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const postVoted = hasVoted(post.id);
  const postUpvoted = userVotes[post.id] === 1;
  const postDownvoted = userVotes[post.id] === -1;

  // Build comment tree (flat list → nested max 2 levels)
  const topLevel = (comments as any[]).filter((c) => !c.parentId);
  const getReplies = (parentId: number) => (comments as any[]).filter((c) => c.parentId === parentId);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
      <div className="container" style={{ paddingTop: "32px", paddingBottom: "64px" }}>
        {/* Back */}
        <button
          onClick={() => setLocation("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.04em",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            marginBottom: "32px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ChevronLeft style={{ width: "12px", height: "12px" }} />
          Back
        </button>

        {/* Post */}
        <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "32px", marginBottom: "32px" }}>
          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--accent-dim)",
            }}>
              {post.communityId || "general"}
            </span>
            {post.isStub && <span className="stub-badge">stub</span>}
            {post.requiresConsensus && <span className="consensus-gate">⊙ gate</span>}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)", marginLeft: "auto" }}>
              {formatTime(post.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ marginBottom: "20px" }}>{post.title}</h1>

          {/* Body */}
          {post.body && (
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.75, marginBottom: "24px", maxWidth: "68ch" }}>
              {post.body}
            </p>
          )}

          {/* Post actions row */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Vote */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                className={`vote-btn${postUpvoted ? " vote-btn--voted" : ""}`}
                onClick={(e) => handleVote(post.id, 1, e)}
              >
                <span className="vote-btn__arrow" style={{ color: postUpvoted ? "var(--accent)" : undefined }}>↑</span>
              </button>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: postVoted ? "var(--text-secondary)" : "var(--text-faint)",
              }}>
                {postVoted ? (post.score ?? 0) : "·"}
              </span>
              <button
                className={`vote-btn${postDownvoted ? " vote-btn--voted" : ""}`}
                onClick={(e) => handleVote(post.id, -1, e)}
              >
                <span className="vote-btn__arrow" style={{ color: postDownvoted ? "var(--negative)" : undefined }}>↓</span>
              </button>
            </div>

            <span style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
              <MessageCircle style={{ width: "11px", height: "11px", display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
              {comments.length}
            </span>

            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-faint)",
              marginLeft: "auto",
            }}>
              {(post as any).pseudonym ?? "anon"}
            </span>
          </div>
        </div>

        {/* Comment composer */}
        <div style={{ marginBottom: "40px" }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "16px",
          }}>
            Discussion · {comments.length}
          </p>

          {isAuthenticated ? (
            <div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add to the discussion…"
                rows={4}
                style={{ width: "100%", resize: "vertical", marginBottom: "8px" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  onClick={() => setNewComment("")}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!newComment.trim()}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    border: "1px solid var(--accent)",
                    color: "var(--accent)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    background: "none",
                    fontFamily: "var(--font-ui)",
                    opacity: newComment.trim() ? 1 : 0.4,
                  }}
                >
                  Reply
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", border: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
                Login to participate in the discussion.
              </span>
              <button
                onClick={() => (window.location.href = getLoginUrl())}
                style={{
                  padding: "6px 12px",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  borderRadius: "3px",
                  fontSize: "12px",
                  fontFamily: "var(--font-ui)",
                  cursor: "pointer",
                  background: "none",
                  flexShrink: 0,
                }}
              >
                Login
              </button>
            </div>
          )}
        </div>

        {/* Comments */}
        {commentsLoading ? (
          <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>Loading…</div>
        ) : (
          <ul className="reply-tree">
            {topLevel.length === 0 && (
              <li style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "16px 0" }}>
                No replies yet.
              </li>
            )}
            {topLevel.map((comment: any) => {
              const cVoted = hasVoted(comment.id);
              const cUpvoted = userVotes[comment.id] === 1;
              const cDownvoted = userVotes[comment.id] === -1;
              const replies = getReplies(comment.id);

              return (
                <li key={comment.id} className="reply">
                  <div className="reply__author">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)" }}>
                      {comment.pseudonym ?? "anon"}
                    </span>
                    <span style={{ marginLeft: "8px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="reply__body">{comment.body}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <button
                        className={`vote-btn${cUpvoted ? " vote-btn--voted" : ""}`}
                        onClick={(e) => handleVote(comment.id, 1, e)}
                      >
                        <span style={{ fontSize: "12px", color: cUpvoted ? "var(--accent)" : undefined }}>↑</span>
                      </button>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: cVoted ? "var(--text-secondary)" : "var(--text-faint)" }}>
                        {cVoted ? (comment.score ?? 0) : "·"}
                      </span>
                      <button
                        className={`vote-btn${cDownvoted ? " vote-btn--voted" : ""}`}
                        onClick={(e) => handleVote(comment.id, -1, e)}
                      >
                        <span style={{ fontSize: "12px", color: cDownvoted ? "var(--negative)" : undefined }}>↓</span>
                      </button>
                    </div>
                    {isAuthenticated && (
                      <>
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                        >
                          reply
                        </button>
                        <button
                          onClick={() => setSteelmanTarget(steelmanTarget === comment.id ? null : comment.id)}
                          style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-dim)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                          title="Steelman — restate the opposing view before replying"
                        >
                          steelman
                        </button>
                      </>
                    )}
                  </div>

                  {/* Nested replies (max 1 level deep) */}
                  {replies.length > 0 && (
                    <ul className="reply-tree" style={{ marginTop: "4px" }}>
                      {replies.map((reply: any) => {
                        const rVoted = hasVoted(reply.id);
                        const rUpvoted = userVotes[reply.id] === 1;
                        const rDownvoted = userVotes[reply.id] === -1;
                        return (
                          <li key={reply.id} className="reply reply--nested">
                            <div className="reply__author">
                              <span>{reply.pseudonym ?? "anon"}</span>
                              <span style={{ marginLeft: "8px" }}>{formatTime(reply.createdAt)}</span>
                            </div>
                            <p className="reply__body">{reply.body}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <button className={`vote-btn${rUpvoted ? " vote-btn--voted" : ""}`} onClick={(e) => handleVote(reply.id, 1, e)}>
                                <span style={{ fontSize: "12px", color: rUpvoted ? "var(--accent)" : undefined }}>↑</span>
                              </button>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: rVoted ? "var(--text-secondary)" : "var(--text-faint)" }}>
                                {rVoted ? (reply.score ?? 0) : "·"}
                              </span>
                              <button className={`vote-btn${rDownvoted ? " vote-btn--voted" : ""}`} onClick={(e) => handleVote(reply.id, -1, e)}>
                                <span style={{ fontSize: "12px", color: rDownvoted ? "var(--negative)" : undefined }}>↓</span>
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Steelman modal */}
      {steelmanTarget !== null && (() => {
        const targetComment = (comments as any[]).find((c) => c.id === steelmanTarget);
        return (
          <SteelmanModal
            isOpen={true}
            originalArgument={targetComment?.body ?? ""}
            onClose={() => setSteelmanTarget(null)}
            onSubmit={() => {
              setSteelmanTarget(null);
              setReplyingTo(steelmanTarget);
            }}
          />
        );
      })()}
    </div>
  );
}
