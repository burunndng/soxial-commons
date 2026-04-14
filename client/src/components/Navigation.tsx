import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MessageCircle, Menu, X, PenSquare } from "lucide-react";

const COMMUNITIES = [
  { name: "technology", label: "Technology", icon: "⚡" },
  { name: "design", label: "Design", icon: "✨" },
  { name: "science", label: "Science", icon: "🔬" },
  { name: "books", label: "Books", icon: "📚" },
  { name: "general", label: "General", icon: "💬" },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => {
              setLocation("/");
              setMobileOpen(false);
            }}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
              <MessageCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-dark hidden sm:inline bg-gradient-to-r from-dark to-neutral-600 bg-clip-text text-transparent">
              Soxial
            </span>
          </button>

          {/* Desktop Communities */}
          <div className="hidden md:flex items-center gap-2 ml-8">
            {COMMUNITIES.map((community) => (
              <button
                key={community.name}
                onClick={() => setLocation(`/c/${community.name}`)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location === `/c/${community.name}`
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-neutral-600 hover:text-dark hover:bg-neutral-50"
                }`}
              >
                <span className="mr-2">{community.icon}</span>
                {community.label}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {isAuthenticated && (
              <button
                onClick={() => setLocation("/compose")}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <PenSquare className="w-4 h-4" />
                Create
              </button>
            )}

            {isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-dark hover:bg-neutral-100 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            ) : (
              <>
                <button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="hidden sm:block px-4 py-2 text-sm font-medium text-neutral-600 hover:text-dark hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                >
                  Login
                </button>
                <button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="hidden sm:block px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Join
                </button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-dark" />
              ) : (
                <Menu className="w-5 h-5 text-dark" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-neutral-200 animate-slide-down">
            <div className="flex flex-col gap-2 mt-4">
              {COMMUNITIES.map((community) => (
                <button
                  key={community.name}
                  onClick={() => {
                    setLocation(`/c/${community.name}`);
                    setMobileOpen(false);
                  }}
                  className={`px-4 py-3 text-sm font-medium rounded-lg text-left transition-colors ${
                    location === `/c/${community.name}`
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-neutral-600 hover:text-dark hover:bg-neutral-50"
                  }`}
                >
                  <span className="mr-2">{community.icon}</span>
                  {community.label}
                </button>
              ))}

              {isAuthenticated && (
                <button
                  onClick={() => {
                    setLocation("/compose");
                    setMobileOpen(false);
                  }}
                  className="mt-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <PenSquare className="w-4 h-4" />
                  Create Post
                </button>
              )}

              {!isAuthenticated && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => (window.location.href = getLoginUrl())}
                    className="flex-1 px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => (window.location.href = getLoginUrl())}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg"
                  >
                    Join
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
