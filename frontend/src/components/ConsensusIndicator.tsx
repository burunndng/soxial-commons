"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type ConsensusState } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ConsensusIndicatorProps {
  postId: string;
  requiresConsensus: boolean;
  endorsementCount: number;
  onUpdated?: (count: number) => void;
  size?: "sm" | "md";
}

const REQUIRED = 3;

const STATUS_LABELS = {
  pending: "Awaiting cross-cluster endorsement",
  partial: "Partially endorsed",
  open: "Community-verified",
};

export function ConsensusIndicator({
  postId,
  requiresConsensus,
  endorsementCount: initialCount,
  onUpdated,
  size = "sm",
}: ConsensusIndicatorProps) {
  const { isAuthenticated, login } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [hasEndorsed, setHasEndorsed] = useState(false);
  const [endorsing, setEndorsing] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (!requiresConsensus) return null;

  const status: ConsensusState["status"] =
    count === 0 ? "pending" : count < REQUIRED ? "partial" : "open";

  const handleEndorse = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasEndorsed || endorsing || status === "open") return;
    if (!isAuthenticated) {
      await login();
      return;
    }
    setEndorsing(true);
    try {
      const res = await api.endorse(postId);
      setCount(res.endorsed);
      setHasEndorsed(true);
      onUpdated?.(res.endorsed);
    } catch {
      // already endorsed or error
    } finally {
      setEndorsing(false);
    }
  };

  const dotSize = size === "sm" ? "5px" : "7px";
  const gap = size === "sm" ? "3px" : "4px";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Dot progress */}
      <button
        onClick={handleEndorse}
        disabled={hasEndorsed || status === "open" || endorsing}
        data-testid={`consensus-endorse-${postId}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap,
          background: "none",
          border: "none",
          cursor: hasEndorsed || status === "open" ? "default" : "pointer",
          padding: "2px",
        }}
        title={
          status === "open"
            ? STATUS_LABELS.open
            : hasEndorsed
            ? "You endorsed this"
            : "Endorse from opposing viewpoint"
        }
      >
        {Array.from({ length: REQUIRED }).map((_, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{
              backgroundColor: i < count ? "var(--accent)" : "var(--border-c)",
              scale: i < count && i === count - 1 ? [1, 1.4, 1] : 1,
            }}
            transition={{
              delay: i * 0.08,
              duration: 0.3,
              scale: { duration: 0.25 },
            }}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              display: "block",
            }}
          />
        ))}
      </button>

      {/* Status label */}
      <span
        style={{
          fontFamily: "var(--font-dm-mono)",
          fontSize: size === "sm" ? "9px" : "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color:
            status === "open"
              ? "var(--positive)"
              : status === "partial"
              ? "var(--caution)"
              : "var(--text-faint)",
          transition: "color 300ms",
        }}
        data-testid={`consensus-status-${postId}`}
      >
        {status === "open" ? "verified" : `${count}/${REQUIRED}`}
      </span>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: "0",
              backgroundColor: "var(--surface-overlay)",
              border: "1px solid var(--border-subtle)",
              padding: "6px 10px",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-dm-mono)",
              fontSize: "10px",
              color: "var(--text-secondary)",
              letterSpacing: "0.04em",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            {STATUS_LABELS[status]}
            {!hasEndorsed && status !== "open" && isAuthenticated && (
              <span style={{ color: "var(--accent)", marginLeft: "6px" }}>
                — click to endorse
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
