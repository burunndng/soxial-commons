import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MessageCircle } from "lucide-react";

const COMMUNITIES = [
  { name: "technology", label: "Technology", icon: "⚡" },
  { name: "design", label: "Design", icon: "✨" },
  { name: "science", label: "Science", icon: "🔬" },
  { name: "books", label: "Books", icon: "📚" },
  { name: "general", label: "General", icon: "💬" },
];

export default function Navigation() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--surface-base)", padding: "16px 0" }}>
      <div className="container flex items-center justify-between">
        <button onClick={() => setLocation("/")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <MessageCircle style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
          <span style={{ fontFamily: "var(--font-editorial)", fontSize: "16px", color: "var(--text-primary)" }}>Soxial</span>
        </button>

        <div style={{ display: "flex", gap: "20px" }}>
          {COMMUNITIES.map((c) => (
            <button key={c.name} onClick={() => setLocation(`/c/${c.name}`)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-ui)", display: "flex", alignItems: "center", gap: "4px", padding: 0 }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {isAuthenticated ? (
            <>
              <button onClick={() => setLocation("/compose")} style={{ padding: "6px 12px", background: "none", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", borderRadius: "3px", fontSize: "12px", fontFamily: "var(--font-ui)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-primary)"; }}>Create</button>
              <button onClick={logout} style={{ padding: "6px 12px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-ui)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>Logout</button>
            </>
          ) : (
            <button onClick={() => (window.location.href = getLoginUrl())} style={{ padding: "6px 12px", background: "none", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", borderRadius: "3px", fontSize: "12px", fontFamily: "var(--font-ui)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-primary)"; }}>Login</button>
          )}
        </div>
      </div>
    </nav>
  );
}
