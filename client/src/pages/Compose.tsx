import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";

const COMMUNITIES = [
  { id: 1, name: "technology", label: "Technology", icon: "⚡" },
  { id: 2, name: "design", label: "Design", icon: "✦" },
  { id: 3, name: "science", label: "Science", icon: "◎" },
  { id: 4, name: "books", label: "Books", icon: "◈" },
  { id: 5, name: "general", label: "General", icon: "◇" },
];

export default function Compose() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [communityId, setCommunityId] = useState(1);
  const [isStub, setIsStub] = useState(false);
  const [requiresConsensus, setRequiresConsensus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
        <div className="container" style={{ paddingTop: "64px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px", marginBottom: "16px" }}>
            You must be logged in to create a post.
          </p>
          <button
            onClick={() => (window.location.href = getLoginUrl())}
            style={{ padding: "8px 16px", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: "3px", fontSize: "13px", fontFamily: "var(--font-ui)", cursor: "pointer", background: "none" }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      setLocation("/");
    } catch {
      // handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCommunity = COMMUNITIES.find((c) => c.id === communityId);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--surface-base)" }}>
      <div className="container" style={{ maxWidth: "720px", paddingTop: "32px", paddingBottom: "64px" }}>
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

        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "24px", marginBottom: "32px" }}>
          <h1>New post</h1>
          <p style={{ marginTop: "8px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.04em" }}>
            Your name will not be attached. A per-thread pseudonym is assigned automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Community selector */}
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}
            >
              Space
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {COMMUNITIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCommunityId(c.id)}
                  style={{
                    padding: "6px 12px",
                    border: communityId === c.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                    color: communityId === c.id ? "var(--accent)" : "var(--text-secondary)",
                    backgroundColor: communityId === c.id ? "var(--accent-subtle)" : "transparent",
                    borderRadius: "3px",
                    fontSize: "12px",
                    fontFamily: "var(--font-ui)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="State your idea or question clearly"
              maxLength={300}
              style={{ width: "100%", fontSize: "16px", fontFamily: "var(--font-editorial)" }}
              autoFocus
            />
            <p style={{ marginTop: "4px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-faint)" }}>
              {title.length}/300
            </p>
          </div>

          {/* Body */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}
            >
              Body <span style={{ color: "var(--text-faint)" }}>(optional)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add context, evidence, or nuance…"
              rows={6}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          {/* URL */}
          <div style={{ marginBottom: "32px" }}>
            <label
              style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}
            >
              Link <span style={{ color: "var(--text-faint)" }}>(optional)</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              style={{ width: "100%" }}
            />
          </div>

          {/* Options */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
              marginBottom: "32px",
            }}
          >
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "16px" }}>
              Post mechanics
            </p>

            <label
              style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", marginBottom: "16px" }}
            >
              <input
                type="checkbox"
                checked={isStub}
                onChange={(e) => setIsStub(e.target.checked)}
                style={{ marginTop: "2px", accentColor: "var(--accent)" }}
              />
              <div>
                <p style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "2px" }}>
                  Incomplete post <span className="stub-badge" style={{ marginLeft: "6px" }}>stub</span>
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  Open for co-authoring. Others can contribute and refine the idea.
                </p>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={requiresConsensus}
                onChange={(e) => setRequiresConsensus(e.target.checked)}
                style={{ marginTop: "2px", accentColor: "var(--accent)" }}
              />
              <div>
                <p style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "2px" }}>
                  Require consensus <span className="consensus-gate" style={{ marginLeft: "6px" }}>⊙ gate</span>
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  Needs endorsements from opposing viewpoints before full visibility.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
            <button
              type="button"
              onClick={() => setLocation("/")}
              style={{ padding: "8px 16px", fontSize: "13px", color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              style={{
                padding: "8px 20px",
                fontSize: "13px",
                border: "1px solid var(--accent)",
                color: title.trim() && !isSubmitting ? "var(--accent)" : "var(--text-faint)",
                borderColor: title.trim() && !isSubmitting ? "var(--accent)" : "var(--border)",
                borderRadius: "3px",
                cursor: title.trim() && !isSubmitting ? "pointer" : "not-allowed",
                background: "none",
                fontFamily: "var(--font-ui)",
                opacity: title.trim() && !isSubmitting ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (title.trim() && !isSubmitting) e.currentTarget.style.backgroundColor = "var(--accent-subtle)";
              }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {isSubmitting ? "Publishing…" : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
