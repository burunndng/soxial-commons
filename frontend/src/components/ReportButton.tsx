"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const REASONS = [
  { value: "spam", label: "Spam or promotional content" },
  { value: "harassment", label: "Harassment or personal attack" },
  { value: "misinformation", label: "Demonstrably false information" },
  { value: "bad_faith", label: "Bad-faith participation" },
  { value: "off_topic", label: "Completely off-topic" },
  { value: "other", label: "Other" },
];

interface ReportButtonProps {
  targetId: string;
  targetType: "post" | "comment";
  onReported?: () => void;
}

export function ReportButton({ targetId, targetType, onReported }: ReportButtonProps) {
  const { isAuthenticated, login } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      await login();
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      if (targetType === "post") {
        await api.reportPost(targetId, reason, details || undefined);
      } else {
        await api.reportComment(targetId, reason, details || undefined);
      }
      setDone(true);
      onReported?.();
      setTimeout(() => setOpen(false), 1500);
    } catch {
      // already reported or error
      setDone(true);
      setTimeout(() => setOpen(false), 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        data-testid={`report-btn-${targetId}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3px",
          fontFamily: "var(--font-dm-mono)",
          fontSize: "9px",
          letterSpacing: "0.04em",
          color: "var(--text-faint)",
          padding: "2px 0",
          transition: "color 120ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--negative)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
        title="Report this content"
      >
        <Flag size={9} />
        <span className="hidden sm:inline">report</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
            }}
            data-testid="report-modal-backdrop"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "460px",
                backgroundColor: "var(--surface-raised)",
                border: "1px solid var(--border-c)",
                padding: "28px",
              }}
              data-testid="report-modal"
            >
              {done ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: "11px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--positive)",
                    }}
                  >
                    Report submitted
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "8px",
                    }}
                  >
                    A jury will convene if the threshold is reached.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontSize: "9px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--negative)",
                          marginBottom: "6px",
                        }}
                      >
                        Report {targetType}
                      </p>
                      <h2
                        style={{
                          fontFamily: "var(--font-instrument-serif)",
                          fontSize: "18px",
                          fontWeight: 400,
                          color: "var(--text-primary)",
                        }}
                      >
                        Why are you reporting this?
                      </h2>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      style={{
                        padding: "4px",
                        color: "var(--text-muted)",
                        marginLeft: "16px",
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginBottom: "18px",
                      lineHeight: 1.6,
                    }}
                  >
                    Reports are reviewed by a randomly-selected community jury.{" "}
                    {REPORT_THRESHOLD_MSG}
                  </p>

                  {/* Reason selection */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      marginBottom: "16px",
                    }}
                  >
                    {REASONS.map((r) => (
                      <label
                        key={r.value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          border: `1px solid ${reason === r.value ? "var(--accent-dim)" : "var(--border-subtle)"}`,
                          backgroundColor:
                            reason === r.value
                              ? "var(--accent-subtle)"
                              : "transparent",
                          cursor: "pointer",
                          transition: "border-color 120ms, background-color 120ms",
                        }}
                      >
                        <input
                          type="radio"
                          name="report-reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={() => setReason(r.value)}
                          style={{
                            accentColor: "var(--accent)",
                            width: "auto",
                          }}
                          data-testid={`report-reason-${r.value}`}
                        />
                        <span
                          style={{
                            fontSize: "13px",
                            color:
                              reason === r.value
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                          }}
                        >
                          {r.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Details */}
                  {reason === "other" && (
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Additional details (optional)…"
                      rows={3}
                      data-testid="report-details-input"
                      style={{ marginBottom: "16px", resize: "vertical" }}
                    />
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={() => setOpen(false)}
                      style={{
                        padding: "7px 14px",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!reason || submitting}
                      data-testid="report-submit-btn"
                      style={{
                        padding: "7px 18px",
                        fontSize: "11px",
                        fontFamily: "var(--font-dm-mono)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        border: `1px solid ${reason && !submitting ? "var(--negative)" : "var(--border-c)"}`,
                        color:
                          reason && !submitting
                            ? "var(--negative)"
                            : "var(--text-faint)",
                        opacity: reason && !submitting ? 1 : 0.5,
                        cursor: reason && !submitting ? "pointer" : "not-allowed",
                      }}
                    >
                      {submitting ? "Submitting…" : "Submit report"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const REPORT_THRESHOLD_MSG =
  "A jury convenes after 3 reports. Verdicts are by majority, blind until all jurors vote.";
const REPORT_THRESHOLD = 3;
