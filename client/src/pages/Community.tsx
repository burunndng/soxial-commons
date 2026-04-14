import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MessageCircle, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const COMMUNITY_META: Record<string, { icon: string; description: string }> = {
  technology: { icon: "⚡", description: "Technology, programming, AI, and digital craft." },
  design: { icon: "✦", description: "Design thinking, UX/UI, visual language, and creative process." },
  science: { icon: "◎", description: "Scientific discoveries, research, and the pursuit of understanding." },
  books: { icon: "◈", description: "Literature, reading, and thoughtful textual analysis." },
  general: { icon: "◇", description: "Philosophy, culture, society, and everything else." },
};

export default function Community() {
  const [match, params] = useRoute("/c/:community");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [sortBy, setSortBy] = useState<"score" | "recent">("recent");
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

  if (!match) return null;

  const communityName = params?.community as string;
  const meta = COMMUNITY_META[communityName] ?? { icon: "◇", description: `Discussion space for ${communityName}.` };

  const { data: community } = trpc.communities.getByName.useQuery({ name: communityName });
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
    setUserVotes((prev) => ({ ...prev, [postId]: prev[postId] === value ? 0 : value }));
  };

  const hasVoted = (id: number) => id in userVotes && userVotes[id] !== 0;

  const displayName = community?.displayName || communityName.charAt(0).toUpperCase() + communityName.slice(1);
  const description = community?.description || meta.description;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
      {/* Topic Header */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container">
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
              padding: "24px 0 0",
              marginBottom: "8px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ChevronLeft style={{ width: "12px", height: "12px" }} />
            All spaces
          </button>

          <div className="topic-header">
            <p className="topic-header__active">
              <span>{meta.icon}</span> {displayName}
            </p>
            <h1 className="topic-header__name">{displayName}</h1>
            <p className="topic-header__desc">{description}</p>
            {isAuthenticated && (
              <button
                onClick={() => setLocation("/compose")}
                style={{
                  marginTop: "20px",
                  padding: "7px 14px",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  borderRadius: "3px",
                  fontSize: "12px",
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
                border: "none",
                borderBottom: sortBy === tab ? "1px solid var(--accent)" : "none",
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
              <div key={i} style={{ padding: "20px 0", borderBottom: "1px solid var(--border-subtle)", opacity: 0.4 }}>
                <div style={{ height: "17px", width: "60%", backgroundColor: "var(--surface-overlay)", borderRadius: "2px", marginBottom: "8px" }} />
                <div style={{ height: "13px", width: "80%", backgroundColor: "var(--surface-overlay)", borderRadius: "2px" }} />
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {!isLoading && posts.length === 0 && (
          <div style={{ padding: "48px 0", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            No posts yet in this space.
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
                    {post.isStub && <span className="stub-badge">stub</span>}
                    {post.requiresConsensus && <span className="consensus-gate">⊙ gate</span>}
                  </div>
                  <h3 className="post-card__title">{post.title}</h3>
                  {post.body && <p className="post-card__excerpt">{post.body}</p>}
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
                    <span className="post-card__author">{post.pseudonym ?? "anon"}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Login prompt */}
        {!isAuthenticated && !isLoading && (
          <div style={{ marginTop: "40px", padding: "24px", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
              Login to post and vote in {displayName}.
            </span>
            <button
              onClick={() => (window.location.href = getLoginUrl())}
              style={{ padding: "6px 12px", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: "3px", fontSize: "12px", fontFamily: "var(--font-ui)", cursor: "pointer", background: "none", flexShrink: 0 }}
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
