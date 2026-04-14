"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { PostCard } from "@/components/PostCard";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, login } = useAuth();
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: () => api.feed({ limit: 25 }),
  });

  const sorted = [...posts].sort((a, b) => {
    if (sortBy === "top") return b.score - a.score;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
      {/* Hero */}
      <div
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "52px 0 44px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(https://images.unsplash.com/photo-1485025798926-cde0f0d24cca?w=1400&q=40)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.04,
            pointerEvents: "none",
          }}
        />
        <div className="container-narrow" style={{ position: "relative" }}>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "14px",
            }}
          >
            The Commons
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            style={{ marginBottom: "14px" }}
          >
            Without the noise.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            style={{
              color: "var(--text-muted)",
              maxWidth: "50ch",
              lineHeight: 1.7,
              fontSize: "14px",
            }}
          >
            Ideas surface by merit, not momentum. Scores are hidden until you
            vote. Feeds are randomised. No profiles, no karma.
          </motion.p>
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ marginTop: "24px" }}
            >
              <Link
                href="/compose"
                data-testid="hero-compose-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 18px",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  fontSize: "12px",
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
            </motion.div>
          )}
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
              data-testid={`sort-tab-${tab}`}
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

        {/* Loading skeleton */}
        {isLoading && (
          <div>
            {[1, 2, 3, 4].map((i) => (
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
                    width: "60%",
                    backgroundColor: "var(--surface-overlay)",
                    borderRadius: "2px",
                    marginBottom: "10px",
                  }}
                />
                <div
                  style={{
                    height: "12px",
                    width: "85%",
                    backgroundColor: "var(--surface-overlay)",
                    borderRadius: "2px",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Post list */}
        {!isLoading && sorted.length === 0 && (
          <p
            style={{
              padding: "48px 0",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "11px",
              color: "var(--text-faint)",
            }}
          >
            No posts yet — be the first.
          </p>
        )}

        {!isLoading &&
          sorted.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}

        {/* Login prompt */}
        {!isAuthenticated && !isLoading && sorted.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              marginTop: "48px",
              padding: "24px",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  marginBottom: "4px",
                }}
              >
                Vote and reply to shape the commons.
              </p>
              <p
                style={{
                  color: "var(--text-faint)",
                  fontSize: "11px",
                  fontFamily: "var(--font-dm-mono)",
                }}
              >
                No follower counts. No karma. Just ideas.
              </p>
            </div>
            <button
              onClick={login}
              data-testid="feed-login-btn"
              style={{
                padding: "8px 18px",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                fontSize: "12px",
                fontFamily: "var(--font-dm-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                flexShrink: 0,
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--accent-subtle)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Enter
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
