"use client";

import { motion } from "framer-motion";
import { Scale } from "lucide-react";

interface JuryBannerProps {
  juryStatus: string | null | undefined;
  reportCount?: number;
  targetType?: "post" | "comment";
}

export function JuryBanner({ juryStatus, reportCount = 0, targetType = "post" }: JuryBannerProps) {
  if (!juryStatus && reportCount < 3) return null;

  const isActive = juryStatus === "open" || juryStatus === "deliberating";
  const isDecided = juryStatus === "decided";

  const statusConfig = {
    open: {
      label: "Under jury review",
      desc: "A community jury is reviewing this content. No verdict yet.",
      color: "var(--caution)",
    },
    deliberating: {
      label: "Jury deliberating",
      desc: "Jurors have been selected and are submitting verdicts.",
      color: "var(--caution)",
    },
    decided: {
      label: "Jury decision reached",
      desc: "A community jury has reviewed this content.",
      color: "var(--positive)",
    },
  };

  const config = statusConfig[juryStatus as keyof typeof statusConfig] ?? statusConfig.open;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 16px",
        backgroundColor: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `2px solid ${config.color}`,
        marginBottom: "20px",
      }}
      data-testid="jury-banner"
    >
      <Scale
        size={14}
        style={{ color: config.color, flexShrink: 0, marginTop: "1px" }}
      />
      <div>
        <p
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: config.color,
            marginBottom: "3px",
          }}
        >
          {config.label}
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          {config.desc}
        </p>
      </div>
    </motion.div>
  );
}
