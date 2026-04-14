import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowUp, ArrowDown, MessageCircle, Bookmark } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function PostDetail() {
  const [match, params] = useRoute("/post/:id");
  const { isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");

  if (!match) return null;

  const postId = parseInt(params?.id as string);

  // Fetch post details
  const { data: post, isLoading: postLoading } = trpc.posts.getById.useQuery({
    id: postId,
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = trpc.comments.getByPost.useQuery({
    postId,
  });

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const hours = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (postLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Post not found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Post */}
      <Card className="p-6 mb-8">
        <div className="flex gap-4">
          {/* Vote Buttons */}
          <div className="flex flex-col items-center gap-1">
            <button className="p-1 hover:bg-muted rounded transition-colors">
              <ArrowUp className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground">Vote</span>
            <button className="p-1 hover:bg-muted rounded transition-colors">
              <ArrowDown className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Post Content */}
          <div className="flex-1">
            <div className="mb-2 text-xs text-muted-foreground">
              {post.communityId} • {formatTime(post.createdAt)}
            </div>
            <h1 className="font-serif text-3xl font-bold mb-4">
              {post.title}
            </h1>
            <p className="text-base leading-relaxed text-foreground mb-4">
              {post.body}
            </p>
            <div className="flex gap-2">
              {isAuthenticated && (
                <Button variant="outline" size="sm">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Comments Section */}
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-bold mb-4">Discussion</h2>

        {/* Comment Composer */}
        {isAuthenticated ? (
          <Card className="p-4 mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-3 bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-accent"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
              <Button size="sm" disabled={!newComment.trim()}>
                Comment
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-4 mb-6 text-center">
            <p className="text-muted-foreground mb-3">
              Join the discussion
            </p>
            <Button onClick={() => window.location.href = getLoginUrl()}>
              Login to Comment
            </Button>
          </Card>
        )}

        {/* Comments List */}
        {commentsLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No comments yet. Be the first!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <Card key={comment.id} className="p-4">
                <div className="flex gap-4">
                  {/* Vote Buttons */}
                  <div className="flex flex-col items-center gap-1">
                    <button className="p-1 hover:bg-muted rounded transition-colors">
                      <ArrowUp className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <span className="text-xs text-muted-foreground">Vote</span>
                    <button className="p-1 hover:bg-muted rounded transition-colors">
                      <ArrowDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">
                        {comment.pseudonym}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-3">
                      {comment.body}
                    </p>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      Reply
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
