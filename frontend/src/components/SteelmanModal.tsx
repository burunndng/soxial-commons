"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type Comment } from "@/lib/api";

interface SteelmanModalProps {
  comment: Comment;
  onClose: () => void;
  onSubmit: (restatement: string) => void;
}

export function SteelmanModal({ comment, onClose, onSubmit }: SteelmanModalProps) {
  const [restatement, setRestatement] = useState("");
  const minLength = 30;
  const isValid = restatement.trim().length >= minLength;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
        onClick={onClose}
        data-testid="steelman-modal-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "540px",
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border-c)",
            padding: "32px",
          }}
          data-testid="steelman-modal"
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "24px",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: "6px",
                }}
              >
                Steelman required
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-instrument-serif)",
                  fontSize: "20px",
                  fontWeight: 400,
                  color: "var(--text-primary)",
                  lineHeight: 1.3,
                }}
              >
                Restate the opposing view
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: "4px",
                color: "var(--text-muted)",
                flexShrink: 0,
                marginLeft: "16px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
              data-testid="steelman-close-btn"
            >
              <X size={16} />
            </button>
          </div>

          {/* Original argument */}
          <div
            style={{
              padding: "14px",
              backgroundColor: "var(--surface-overlay)",
              border: "1px solid var(--border-subtle)",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "9px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                marginBottom: "8px",
              }}
            >
              Original argument
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              &ldquo;{comment.body}&rdquo;
            </p>
          </div>

          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              marginBottom: "16px",
            }}
          >
            Before replying, demonstrate you understand this position by
            restating it in your own words, as charitably as possible.
          </p>

          <textarea
            value={restatement}
            onChange={(e) => setRestatement(e.target.value)}
            placeholder="The strongest version of this argument is…"
            rows={4}
            data-testid="steelman-input"
            style={{ marginBottom: "6px", resize: "vertical" }}
          />
          <p
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: "10px",
              color:
                restatement.length >= minLength
                  ? "var(--positive)"
                  : "var(--text-faint)",
              marginBottom: "20px",
              transition: "color 200ms",
            }}
          >
            {restatement.trim().length} / {minLength} characters minimum
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              onClick={onClose}
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
              disabled={!isValid}
              onClick={() => isValid && onSubmit(restatement)}
              data-testid="steelman-submit-btn"
              style={{
                padding: "8px 20px",
                fontSize: "12px",
                border: `1px solid ${isValid ? "var(--accent)" : "var(--border-c)"}`,
                color: isValid ? "var(--accent)" : "var(--text-faint)",
                fontFamily: "var(--font-dm-sans)",
                opacity: isValid ? 1 : 0.5,
                cursor: isValid ? "pointer" : "not-allowed",
                transition: "border-color 200ms, color 200ms",
              }}
            >
              Continue to reply
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
