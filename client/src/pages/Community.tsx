import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowUp, ArrowDown, MessageCircle, Bookmark } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Community() {
  const [match, params] = useRoute("/c/:community");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [sortBy, setSortBy] = useState<"score" | "recent">("score");

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Community Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2 capitalize">
          {community?.displayName || communityName}
        </h1>
        <p className="text-muted-foreground mb-4">
          {community?.description || `A space for thoughtful discussion about ${communityName}.`}
        </p>
        {isAuthenticated && (
          <Button>Create Post</Button>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={sortBy === "score" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("score")}
        >
          Top
        </Button>
        <Button
          variant={sortBy === "recent" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("recent")}
        >
          Recent
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading discussions...</p>
        </div>
      )}

      {/* Posts List */}
      {!isLoading && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No posts yet in this community.</p>
            </Card>
          ) : (
            posts.map((post: any) => (
              <Card
                key={post.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/post/${post.id}`)}
              >
                <div className="flex gap-4">
                  {/* Vote Buttons */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      className="p-1 hover:bg-muted rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) window.location.href = getLoginUrl();
                      }}
                    >
                      <ArrowUp className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <span className="text-xs text-muted-foreground">Vote</span>
                    <button
                      className="p-1 hover:bg-muted rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) window.location.href = getLoginUrl();
                      }}
                    >
                      <ArrowDown className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 text-xs text-muted-foreground">
                      {formatTime(post.createdAt)}
                    </div>
                    <h2 className="font-serif text-lg font-semibold mb-1 hover:underline">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.body}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/post/${post.id}`);
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.commentCount || 0}
                      </button>
                      {isAuthenticated && (
                        <button
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Bookmark className="w-4 h-4" />
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Login Prompt */}
      {!isAuthenticated && (
        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground mb-4">
            Join the conversation
          </p>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Login to Participate
          </Button>
        </div>
      )}
    </div>
  );
}
