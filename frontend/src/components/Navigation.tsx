"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Menu, X, PenLine, LogIn, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const COMMUNITIES = [
  { slug: "technology", label: "Technology" },
  { slug: "design", label: "Design" },
  { slug: "science", label: "Science" },
  { slug: "books", label: "Books" },
  { slug: "general", label: "General" },
];

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user, login, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (slug: string) => pathname === `/c/${slug}`;

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: "rgba(18, 18, 22, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container-wide"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
          data-testid="nav-logo"
        >
          <MessageCircle
            size={18}
            style={{ color: "var(--accent)", flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: "17px",
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Soxial
          </span>
        </Link>

        {/* Desktop community links */}
        <div
          className="hidden md:flex"
          style={{ gap: "4px", alignItems: "center" }}
        >
          {COMMUNITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              data-testid={`nav-community-${c.slug}`}
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "6px 10px",
                color: isActive(c.slug)
                  ? "var(--accent)"
                  : "var(--text-muted)",
                borderBottom: isActive(c.slug)
                  ? "1px solid var(--accent)"
                  : "1px solid transparent",
                textDecoration: "none",
                transition: "color 120ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive(c.slug))
                  e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive(c.slug))
                  e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {/* Auth actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!loading && isAuthenticated && (
            <>
              <Link
                href="/compose"
                data-testid="nav-compose-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  border: "1px solid var(--border-c)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  textDecoration: "none",
                  transition: "border-color 120ms, color 120ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-c)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
              >
                <PenLine size={12} />
                <span className="hidden sm:inline">New post</span>
              </Link>
              <span
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: "10px",
                  color: "var(--text-faint)",
                  letterSpacing: "0.04em",
                }}
                className="hidden sm:block"
                data-testid="nav-pseudonym"
              >
                {user?.pseudonym}
              </span>
              <button
                onClick={logout}
                data-testid="nav-logout-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 8px",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  fontFamily: "var(--font-dm-sans)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </>
          )}
          {!loading && !isAuthenticated && (
            <button
              onClick={login}
              data-testid="nav-login-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                border: "1px solid var(--border-c)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                transition: "border-color 120ms, color 120ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-c)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
            >
              <LogIn size={13} />
              Enter
            </button>
          )}
          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            data-testid="nav-mobile-toggle"
            style={{ padding: "6px", color: "var(--text-muted)" }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{
              overflow: "hidden",
              borderTop: "1px solid var(--border-subtle)",
              backgroundColor: "var(--surface-raised)",
            }}
          >
            <div
              className="container-wide"
              style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {COMMUNITIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/c/${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: isActive(c.slug)
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                    textDecoration: "none",
                  }}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
