import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowUp, ArrowDown, MessageCircle, Bookmark, Share2, Users, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const COMMUNITY_ICONS: Record<string, string> = {
  technology: "⚡",
  design: "✨",
  science: "🔬",
  books: "📚",
  general: "💬",
};

const COMMUNITY_DESCRIPTIONS: Record<string, string> = {
  technology: "Discussions about technology, programming, AI, and digital innovation.",
  design: "Design thinking, UX/UI, visual arts, and creative expression.",
  science: "Scientific discoveries, research, and the pursuit of knowledge.",
  books: "Literature, reading, book recommendations, and thoughtful analysis.",
  general: "Everything else—philosophy, culture, society, and beyond.",
};

export default function Community() {
  const [match, params] = useRoute("/c/:community");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [sortBy, setSortBy] = useState<"score" | "recent">("recent");
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

  if (!match) return null;

  const communityName = params?.community as string;

  // Fetch community info
  const { data: community } = trpc.communities.getByName.useQuery({
    name: communityName,
  });

  // Fetch community feed
  const { data: posts = [], isLoading } = trpc.posts.getFeed.useQuery({
    limit: 25,
  });

  const formatTime = (date: Date) => {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleVote = (postId: number, value: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setUserVotes((prev) => ({
      ...prev,
      [postId]: prev[postId] === value ? 0 : value,
    }));
  };

  const communityDisplayName = community?.displayName || communityName.charAt(0).toUpperCase() + communityName.slice(1);
  const communityDescription = community?.description || COMMUNITY_DESCRIPTIONS[communityName] || `A space for thoughtful discussion about ${communityName}.`;
  const communityIcon = COMMUNITY_ICONS[communityName] || "💬";

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Community Header */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-neutral-600 hover:text-dark mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Home
          </button>

          <div className="flex items-start gap-6">
            <div className="text-5xl">{communityIcon}</div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-dark mb-2">
                {communityDisplayName}
              </h1>
              <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                {communityDescription}
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Community</span>
                </div>
                {isAuthenticated && (
                  <button
                    onClick={() => setLocation("/compose")}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Create Post
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setSortBy("recent")}
            className={`px-6 py-2 font-semibold rounded-lg transition-all duration-200 ${
              sortBy === "recent"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy("score")}
            className={`px-6 py-2 font-semibold rounded-lg transition-all duration-200 ${
              sortBy === "score"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Top
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-neutral-200 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Posts List */}
        {!isLoading && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-neutral-600 text-lg">No posts yet in this community. Be the first!</p>
              </div>
            ) : (
              posts.map((post: any) => (
                <div
                  key={post.id}
                  onClick={() => setLocation(`/post/${post.id}`)}
                  className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex gap-4">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(post.id, 1);
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          userVotes[post.id] === 1
                            ? "bg-blue-100 text-blue-600"
                            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                        }`}
                      >
                        <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                      <span className={`text-sm font-semibold transition-colors ${userVotes[post.id] ? "text-dark" : "text-neutral-500"}`}>
                        {post.score || 0}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(post.id, -1);
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          userVotes[post.id] === -1
                            ? "bg-red-100 text-red-600"
                            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                        }`}
                      >
                        <ArrowDown className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="text-xs text-neutral-500 mb-2">
                            {formatTime(post.createdAt)}
                          </div>
                          <h3 className="text-lg font-bold text-dark group-hover:text-blue-600 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-neutral-600 text-sm line-clamp-2 mb-4">
                        {post.body}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-6 text-neutral-500 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/post/${post.id}`);
                          }}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.commentCount || 0}</span>
                        </button>
                        {isAuthenticated && (
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                          >
                            <Bookmark className="w-4 h-4" />
                            Save
                          </button>
                        )}
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors ml-auto"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Login Prompt */}
        {!isAuthenticated && (
          <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 text-center">
            <h3 className="text-lg font-bold text-dark mb-2">Join the Conversation</h3>
            <p className="text-neutral-600 mb-6">
              Login to share your ideas in {communityDisplayName}
            </p>
            <button
              onClick={() => (window.location.href = getLoginUrl())}
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Login to Participate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
