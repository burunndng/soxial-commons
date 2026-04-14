"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { PostCard } from "@/components/PostCard";

const COMMUNITY_META: Record<string, { description: string }> = {
  technology: { description: "Technology, programming, AI, and digital craft." },
  design: { description: "Design thinking, UX/UI, visual language, and creative process." },
  science: { description: "Scientific discoveries, research, and the pursuit of understanding." },
  books: { description: "Literature, reading, and thoughtful textual analysis." },
  general: { description: "Philosophy, culture, society, and everything else." },
};

export default function CommunityPage() {
  const params = useParams();
  const slug = params?.community as string;
  const { isAuthenticated, login } = useAuth();
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");

  const { data: community } = useQuery({
    queryKey: ["community", slug],
    queryFn: () => api.community(slug),
    enabled: !!slug,
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed", slug],
    queryFn: () => api.feed({ community: slug, limit: 25 }),
    enabled: !!slug,
  });

  const meta = COMMUNITY_META[slug] ?? { description: `Discussion space for ${slug}.` };
  const displayName = community?.name ?? (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "");
  const description = community?.description ?? meta.description;

  const sorted = [...posts].sort((a, b) => {
    if (sortBy === "top") return b.score - a.score;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
      {/* Community header */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container-narrow" style={{ padding: "24px 24px 0" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "10px",
              letterSpacing: "0.04em",
              textDecoration: "none",
              marginBottom: "20px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-secondary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            <ChevronLeft size={12} />
            All spaces
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ paddingBottom: "28px" }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: "8px",
              }}
            >
              Space
            </p>
            <h1 style={{ marginBottom: "10px" }}>{displayName}</h1>
            <p
              style={{
                color: "var(--text-muted)",
                maxWidth: "52ch",
                lineHeight: 1.7,
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {description}
            </p>
            {isAuthenticated && (
              <Link
                href="/compose"
                data-testid="community-compose-btn"
                style={{
                  display: "inline-flex",
                  padding: "7px 14px",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  fontSize: "11px",
                  fontFamily: "var(--font-dm-mono)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "background-color 150ms",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--accent-subtle)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                New post
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Feed */}
      <div
        className="container-narrow"
        style={{ paddingTop: "28px", paddingBottom: "80px" }}
      >
        {/* Sort tabs */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "0",
          }}
        >
          {(["recent", "top"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSortBy(tab)}
              data-testid={`community-sort-${tab}`}
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color:
                  sortBy === tab ? "var(--text-primary)" : "var(--text-faint)",
                borderBottom:
                  sortBy === tab
                    ? "1px solid var(--accent)"
                    : "1px solid transparent",
                paddingBottom: "12px",
                marginBottom: "-1px",
                transition: "color 120ms",
              }}
            >
              {tab === "recent" ? "Recent" : "Top"}
            </button>
          ))}
        </div>

        {isLoading && (
          <div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: "20px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                  opacity: 0.3,
                }}
              >
                <div
                  style={{
                    height: "14px",
                    width: "55%",
                    backgroundColor: "var(--surface-overlay)",
                    borderRadius: "2px",
                    marginBottom: "10px",
                  }}
                />
                <div
                  style={{
                    height: "12px",
                    width: "80%",
                    backgroundColor: "var(--surface-overlay)",
                    borderRadius: "2px",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <p
            style={{
              padding: "48px 0",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "11px",
              color: "var(--text-faint)",
            }}
          >
            No posts yet in this space.
          </p>
        )}

        {!isLoading && sorted.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}

        {!isAuthenticated && !isLoading && sorted.length > 0 && (
          <div
            style={{
              marginTop: "40px",
              padding: "20px",
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
                fontSize: "12px",
                fontFamily: "var(--font-dm-mono)",
              }}
            >
              Enter to post and vote in {displayName}.
            </span>
            <button
              onClick={login}
              data-testid="community-login-btn"
              style={{
                padding: "6px 14px",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                fontSize: "11px",
                fontFamily: "var(--font-dm-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              Enter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
