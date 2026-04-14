import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Lightbulb, Lock } from "lucide-react";

const COMMUNITIES = [
  { id: 1, name: "technology", label: "Technology", icon: "⚡" },
  { id: 2, name: "design", label: "Design", icon: "✨" },
  { id: 3, name: "science", label: "Science", icon: "🔬" },
  { id: 4, name: "books", label: "Books", icon: "📚" },
  { id: 5, name: "general", label: "General", icon: "💬" },
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

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
            <p className="text-neutral-600 mb-6 text-lg">
              You must be logged in to create a post.
            </p>
            <button
              onClick={() => (window.location.href = getLoginUrl())}
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Login to Create Post
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Call tRPC mutation to create post
      // For now, just redirect to home
      setLocation("/");
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCommunity = COMMUNITIES.find((c) => c.id === communityId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-neutral-600 hover:text-dark mb-8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Discussions
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-blue-600" />
            Share Your Idea
          </h1>
          <p className="text-lg text-neutral-600">
            Start a thoughtful discussion with the community.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-neutral-200 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Community Selector */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                Choose Community
              </label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                {COMMUNITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-neutral-500 mt-2">
                Your post will appear in {selectedCommunity?.label}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your idea?"
                maxLength={300}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              <p className="text-xs text-neutral-500 mt-2">
                {title.length}/300 characters
              </p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                Description
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Provide more context or details about your idea..."
                rows={6}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              <p className="text-xs text-neutral-500 mt-2">
                Be clear and thoughtful. This helps others engage meaningfully.
              </p>
            </div>

            {/* URL (optional) */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                Link (optional)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            {/* Options */}
            <div className="space-y-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
              <h3 className="font-semibold text-dark">Advanced Options</h3>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isStub}
                  onChange={(e) => setIsStub(e.target.checked)}
                  className="w-5 h-5 mt-1 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-dark group-hover:text-blue-600 transition-colors">
                    Incomplete Post
                  </p>
                  <p className="text-sm text-neutral-600">
                    Open this post for co-authoring. Others can contribute and refine your idea.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={requiresConsensus}
                  onChange={(e) => setRequiresConsensus(e.target.checked)}
                  className="w-5 h-5 mt-1 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-dark group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Require Consensus
                  </p>
                  <p className="text-sm text-neutral-600">
                    This post needs endorsements from opposing viewpoints before becoming visible to the wider community.
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setLocation("/")}
                className="px-6 py-3 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {isSubmitting ? "Publishing..." : "Publish Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
