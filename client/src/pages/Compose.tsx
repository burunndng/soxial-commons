import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const COMMUNITIES = [
  { id: 1, name: "technology", label: "Technology" },
  { id: 2, name: "design", label: "Design" },
  { id: 3, name: "science", label: "Science" },
  { id: 4, name: "books", label: "Books" },
  { id: 5, name: "general", label: "General" },
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            You must be logged in to create a post.
          </p>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Login to Create Post
          </Button>
        </Card>
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Create Post</h1>
        <p className="text-muted-foreground">
          Share your thoughts with the community.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Community Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Community</label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {COMMUNITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your idea?"
              maxLength={300}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/300
            </p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Provide more context or details..."
              rows={6}
              className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* URL (optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Link (optional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Options */}
          <div className="space-y-3 p-4 bg-muted rounded-md">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isStub}
                onChange={(e) => setIsStub(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">
                <strong>Incomplete post</strong> — Open for co-authoring
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresConsensus}
                onChange={(e) => setRequiresConsensus(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">
                <strong>Require consensus</strong> — Need opposing viewpoint endorsements
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
