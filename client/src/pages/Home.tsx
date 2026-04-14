import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<"score" | "recent">("recent");
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

  const { data: posts = [], isLoading } = trpc.posts.getFeed.useQuery({ limit: 25 });

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const hours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const handleVote = (postId: number, value: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setUserVotes((prev) => ({
      ...prev,
      [postId]: prev[postId] === value ? 0 : value,
    }));
  };

  const hasVoted = (postId: number) => postId in userVotes && userVotes[postId] !== 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
      {/* Hero */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)", padding: "48px 0 40px" }}>
        <div className="container">
          <h1 style={{ marginBottom: "12px" }}>
            The commons, without the noise.
          </h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "52ch", lineHeight: 1.7 }}>
            Ideas surface by merit, not momentum. Scores are hidden until you vote. Feeds are randomised. No profiles, no karma.
          </p>
          {isAuthenticated && (
            <button
              onClick={() => setLocation("/compose")}
              style={{
                marginTop: "24px",
                padding: "8px 16px",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                borderRadius: "3px",
                fontSize: "13px",
                fontFamily: "var(--font-ui)",
                cursor: "pointer",
                background: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--accent-subtle)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              New post
            </button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="container" style={{ paddingTop: "32px", paddingBottom: "64px" }}>
        {/* Sort tabs */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
          {(["recent", "score"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSortBy(tab)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: sortBy === tab ? "var(--text-primary)" : "var(--text-faint)",
                paddingBottom: "12px",
                marginBottom: "-13px",
                cursor: "pointer",
                background: "none",
              } as React.CSSProperties}
            >
              {tab === "recent" ? "Recent" : "Top"}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: "20px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                  opacity: 0.4,
                }}
              >
                <div style={{ height: "17px", width: "60%", backgroundColor: "var(--surface-overlay)", borderRadius: "2px", marginBottom: "8px" }} />
                <div style={{ height: "13px", width: "80%", backgroundColor: "var(--surface-overlay)", borderRadius: "2px" }} />
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {!isLoading && posts.length === 0 && (
          <div style={{ padding: "48px 0", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            No posts yet — be the first.
          </div>
        )}

        {!isLoading && posts.map((post: any) => {
          const voted = hasVoted(post.id);
          const upvoted = userVotes[post.id] === 1;
          const downvoted = userVotes[post.id] === -1;

          return (
            <div
              key={post.id}
              className="post-card"
              onClick={() => setLocation(`/post/${post.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                {/* Vote column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flexShrink: 0, paddingTop: "2px" }}>
                  <button
                    className={`vote-btn${upvoted ? " vote-btn--voted" : ""}`}
                    onClick={(e) => handleVote(post.id, 1, e)}
                    title="Upvote"
                  >
                    <span className="vote-btn__arrow" style={{ color: upvoted ? "var(--accent)" : undefined }}>↑</span>
                  </button>
                  <span
                    className="vote-btn__count"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: voted ? "var(--text-secondary)" : "var(--text-faint)",
                      lineHeight: 1.4,
                    }}
                  >
                    {voted ? (post.score ?? 0) : "·"}
                  </span>
                  <button
                    className={`vote-btn${downvoted ? " vote-btn--voted" : ""}`}
                    onClick={(e) => handleVote(post.id, -1, e)}
                    title="Downvote"
                  >
                    <span className="vote-btn__arrow" style={{ color: downvoted ? "var(--negative)" : undefined }}>↓</span>
                  </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--accent-dim)",
                    }}>
                      {post.communityId || "general"}
                    </span>
                    {post.isStub && (
                      <span className="stub-badge">stub</span>
                    )}
                    {post.requiresConsensus && (
                      <span className="consensus-gate">⊙ gate</span>
                    )}
                  </div>
                  <h3 className="post-card__title">{post.title}</h3>
                  {post.body && (
                    <p className="post-card__excerpt">{post.body}</p>
                  )}
                  <div className="post-card__footer" style={{ marginTop: "12px" }}>
                    <div className="post-card__signals">
                      <button
                        className="post-card__replies"
                        onClick={(e) => { e.stopPropagation(); setLocation(`/post/${post.id}`); }}
                        style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer" }}
                      >
                        <MessageCircle style={{ width: "11px", height: "11px" }} />
                        <span>{post.commentCount ?? 0}</span>
                      </button>
                      <span className="post-card__age">{formatTime(post.createdAt)}</span>
                    </div>
                    <span className="post-card__author">
                      {post.pseudonym ?? "anon"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Login prompt */}
        {!isAuthenticated && !isLoading && (
          <div
            style={{
              marginTop: "40px",
              padding: "24px",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "4px" }}>
                Vote and reply to shape the commons.
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                No follower counts. No karma. Just ideas.
              </p>
            </div>
            <button
              onClick={() => (window.location.href = getLoginUrl())}
              style={{
                padding: "8px 16px",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                borderRadius: "3px",
                fontSize: "13px",
                fontFamily: "var(--font-ui)",
                cursor: "pointer",
                background: "none",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--accent-subtle)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
