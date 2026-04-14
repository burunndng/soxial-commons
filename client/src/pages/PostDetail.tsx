import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ArrowUp, ArrowDown, MessageCircle, Bookmark, Share2, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function PostDetail() {
  const [match, params] = useRoute("/post/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

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
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const hours = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleVote = (itemId: number, value: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setUserVotes((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === value ? 0 : value,
    }));
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-neutral-600">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
            <p className="text-neutral-600 mb-4">Post not found.</p>
            <button
              onClick={() => setLocation("/")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Post */}
        <div className="bg-white border border-neutral-200 rounded-xl p-8 mb-8">
          <div className="flex gap-6">
            {/* Vote Section */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => handleVote(post.id, 1)}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  userVotes[post.id] === 1
                    ? "bg-blue-100 text-blue-600"
                    : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                }`}
              >
                <ArrowUp className="w-6 h-6" strokeWidth={2.5} />
              </button>
              <span className={`text-sm font-bold transition-colors ${userVotes[post.id] ? "text-dark" : "text-neutral-500"}`}>
                {post.score || 0}
              </span>
              <button
                onClick={() => handleVote(post.id, -1)}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  userVotes[post.id] === -1
                    ? "bg-red-100 text-red-600"
                    : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                }`}
              >
                <ArrowDown className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>

            {/* Post Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {post.communityId}
                </span>
                <span className="text-sm text-neutral-500">{formatTime(post.createdAt)}</span>
              </div>

              <h1 className="text-4xl font-bold text-dark mb-6 leading-tight">
                {post.title}
              </h1>

              <p className="text-lg text-neutral-700 leading-relaxed mb-8">
                {post.body}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-6 text-neutral-500">
                <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{comments.length}</span>
                </button>
                {isAuthenticated && (
                  <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                    <Bookmark className="w-5 h-5" />
                    <span className="text-sm font-medium">Save</span>
                  </button>
                )}
                <button className="flex items-center gap-2 hover:text-blue-600 transition-colors ml-auto">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-dark mb-6">Discussion</h2>

          {/* Comment Composer */}
          {isAuthenticated ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                rows={4}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setNewComment("")}
                  className="px-6 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  disabled={!newComment.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  Post Comment
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-8 mb-8 text-center">
              <p className="text-neutral-700 mb-4 text-lg">Join the discussion</p>
              <button
                onClick={() => (window.location.href = getLoginUrl())}
                className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Login to Comment
              </button>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
              <p className="text-neutral-600">No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <div key={comment.id} className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-all">
                  <div className="flex gap-4">
                    {/* Vote Buttons */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleVote(comment.id, 1)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          userVotes[comment.id] === 1
                            ? "bg-blue-100 text-blue-600"
                            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                      <span className={`text-xs font-semibold transition-colors ${userVotes[comment.id] ? "text-dark" : "text-neutral-500"}`}>
                        {comment.score || 0}
                      </span>
                      <button
                        onClick={() => handleVote(comment.id, -1)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          userVotes[comment.id] === -1
                            ? "bg-red-100 text-red-600"
                            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                        }`}
                      >
                        <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm text-dark">
                          {comment.pseudonym}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 mb-3 leading-relaxed">
                        {comment.body}
                      </p>
                      <button className="text-xs text-neutral-500 hover:text-blue-600 transition-colors flex items-center gap-1 font-medium">
                        <MessageCircle className="w-3 h-3" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
