import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MessageCircle } from "lucide-react";

const COMMUNITIES = [
  { name: "technology", label: "Technology" },
  { name: "design", label: "Design" },
  { name: "science", label: "Science" },
  { name: "books", label: "Books" },
  { name: "general", label: "General" },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo / Home */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="font-serif text-lg font-semibold">Soxial</span>
          </button>

          {/* Communities */}
          <div className="flex items-center gap-1">
            {COMMUNITIES.map((community) => (
              <button
                key={community.name}
                onClick={() => setLocation(`/c/${community.name}`)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  location === `/c/${community.name}`
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {community.label}
              </button>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2 ml-auto">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  Join
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
