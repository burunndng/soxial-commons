"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const COMMUNITIES = [
  { slug: "technology", label: "Technology" },
  { slug: "design", label: "Design" },
  { slug: "science", label: "Science" },
  { slug: "books", label: "Books" },
  { slug: "general", label: "General" },
];

export default function ComposePage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();
  const [communitySlug, setCommunitySlug] = useState("technology");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [isStub, setIsStub] = useState(false);
  const [requiresConsensus, setRequiresConsensus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--surface-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "11px",
              marginBottom: "20px",
            }}
          >
            You must be logged in to create a post.
          </p>
          <button
            onClick={login}
            data-testid="compose-login-btn"
            style={{
              padding: "8px 20px",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              fontSize: "12px",
              fontFamily: "var(--font-dm-mono)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.createPost({
        communitySlug,
        title,
        body: body || undefined,
        url: url || undefined,
        isStub,
        requiresConsensus,
      });
      router.push(`/post/${res.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish.";
      setError(msg);
      setSubmitting(false);
    }
  };

  const labelStyle = {
    display: "block",
    fontFamily: "var(--font-dm-mono)",
    fontSize: "9px",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
    marginBottom: "8px",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
      <div
        className="container-narrow"
        style={{ maxWidth: "680px", paddingTop: "32px", paddingBottom: "80px" }}
      >
        {/* Back */}
        <button
          onClick={() => router.back()}
          data-testid="compose-back-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-dm-mono)",
            fontSize: "10px",
            letterSpacing: "0.04em",
            marginBottom: "32px",
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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "24px",
            marginBottom: "32px",
          }}
        >
          <h1 style={{ marginBottom: "8px" }}>New post</h1>
          <p
            style={{
              color: "var(--text-faint)",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "10px",
              letterSpacing: "0.04em",
            }}
          >
            Your name will not be attached. A per-thread pseudonym is assigned
            automatically.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          {/* Community */}
          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>Space</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {COMMUNITIES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCommunitySlug(c.slug)}
                  data-testid={`community-select-${c.slug}`}
                  style={{
                    padding: "6px 14px",
                    border: `1px solid ${communitySlug === c.slug ? "var(--accent)" : "var(--border-c)"}`,
                    color:
                      communitySlug === c.slug
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                    backgroundColor:
                      communitySlug === c.slug
                        ? "var(--accent-subtle)"
                        : "transparent",
                    fontSize: "12px",
                    fontFamily: "var(--font-dm-sans)",
                    transition: "border-color 120ms, color 120ms",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>
              Title{" "}
              <span style={{ color: "var(--text-faint)" }}>
                (required, max 300)
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="State your idea or question clearly"
              maxLength={300}
              data-testid="compose-title-input"
              autoFocus
              style={{
                fontFamily: "var(--font-instrument-serif)",
                fontSize: "18px",
              }}
            />
            <p
              style={{
                marginTop: "4px",
                fontFamily: "var(--font-dm-mono)",
                fontSize: "10px",
                color: title.length > 270 ? "var(--caution)" : "var(--text-faint)",
              }}
            >
              {title.length}/300
            </p>
          </div>

          {/* Body */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>
              Body{" "}
              <span style={{ color: "var(--text-faint)" }}>(optional)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add context, evidence, or nuance…"
              rows={6}
              data-testid="compose-body-input"
              style={{ resize: "vertical" }}
            />
          </div>

          {/* URL */}
          <div style={{ marginBottom: "32px" }}>
            <label style={labelStyle}>
              Link{" "}
              <span style={{ color: "var(--text-faint)" }}>(optional)</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              data-testid="compose-url-input"
            />
          </div>

          {/* Post mechanics */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
              marginBottom: "32px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "9px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "18px",
              }}
            >
              Post mechanics
            </p>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                cursor: "pointer",
                marginBottom: "18px",
              }}
            >
              <input
                type="checkbox"
                checked={isStub}
                onChange={(e) => setIsStub(e.target.checked)}
                data-testid="compose-stub-checkbox"
                style={{
                  width: "auto",
                  marginTop: "2px",
                  accentColor: "var(--accent)",
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    marginBottom: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Incomplete post <span className="stub-badge">stub</span>
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  Open for co-authoring. Others can contribute.
                </p>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={requiresConsensus}
                onChange={(e) => setRequiresConsensus(e.target.checked)}
                data-testid="compose-consensus-checkbox"
                style={{
                  width: "auto",
                  marginTop: "2px",
                  accentColor: "var(--accent)",
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    marginBottom: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Require consensus{" "}
                  <span className="consensus-badge">⊙ gate</span>
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  Needs endorsements from opposing viewpoints.
                </p>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                color: "var(--negative)",
                fontSize: "12px",
                marginBottom: "16px",
                fontFamily: "var(--font-dm-mono)",
              }}
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={() => router.back()}
              data-testid="compose-cancel-btn"
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              data-testid="compose-submit-btn"
              style={{
                padding: "8px 24px",
                fontSize: "12px",
                border: `1px solid ${title.trim() && !submitting ? "var(--accent)" : "var(--border-c)"}`,
                color:
                  title.trim() && !submitting
                    ? "var(--accent)"
                    : "var(--text-faint)",
                fontFamily: "var(--font-dm-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                opacity: title.trim() && !submitting ? 1 : 0.5,
                cursor: title.trim() && !submitting ? "pointer" : "not-allowed",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => {
                if (title.trim() && !submitting)
                  e.currentTarget.style.backgroundColor = "var(--accent-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {submitting ? "Publishing…" : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
