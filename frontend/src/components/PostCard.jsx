import { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import CommentsDrawer from "./CommentsDrawer";
import { mediaUrl } from "../utils/media";

// Instagram-style relative time
function formatPostTime(createdAt) {
  if (!createdAt) return "";

  const created = new Date(createdAt);
  const now = new Date();

  const diffInSeconds = Math.floor((now - created) / 1000);

  if (diffInSeconds < 10) return "Just now";

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);

  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInMonths < 12) {
    return `${diffInMonths}mo`;
  }

  const diffInYears = Math.floor(diffInDays / 365);

  return `${diffInYears}y`;
}

export default function PostCard({ post, onChange }) {
  const { user } = useAuth();

  const [liked, setLiked] = useState(post.likedByMe);
  const [saved, setSaved] = useState(post.savedByMe);
  const [reposted, setReposted] = useState(post.repostedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [repostCount, setRepostCount] = useState(post.repostCount);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Keeps the relative time updated while the page is open
  const [, setTimeTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick((value) => value + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // FIX: agar author null hai (delete ho chuka user) to card render mat karo
  // Ye hooks ke BAAD hai isliye React hooks rule violate nahi hota
  if (!post || !post.author) return null;

  async function toggleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));

    try {
      await api.post(`/posts/${post._id}/like`);
    } catch {
      setLiked((v) => !v);
      setLikeCount((c) => (liked ? c + 1 : c - 1));
    }
  }

  async function toggleSave() {
    setSaved((v) => !v);

    try {
      await api.post(`/posts/${post._id}/save`);
      onChange?.();
    } catch {
      setSaved((v) => !v);
    }
  }

  async function toggleRepost() {
    setReposted((v) => !v);
    setRepostCount((c) => (reposted ? c - 1 : c + 1));

    try {
      await api.post(`/posts/${post._id}/repost`);
      onChange?.();
    } catch {
      setReposted((v) => !v);
      setRepostCount((c) => (reposted ? c + 1 : c - 1));
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post?")) return;

    await api.delete(`/posts/${post._id}`);
    onChange?.();
  }

  return (
    <div className="bg-panel rounded-2xl shadow-card border border-line overflow-hidden">
      {post.repostedBy && (
        <div className="px-4 pt-3 text-xs text-faint flex items-center gap-1.5">
          <Repeat2 size={13} />
          Reposted by {post.repostedBy}
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3.5">
        <Link
          to={`/profile/${post.author.username}`}
          className="flex items-center gap-3"
        >
          <img
            src={
              mediaUrl(post.author.avatar) ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`
            }
            className="w-10 h-10 rounded-full object-cover"
            alt=""
          />

          <div>
            <p className="text-sm font-semibold leading-tight">
              {post.author.username}
            </p>

            <div className="flex items-center gap-1.5">
              <p className="text-xs text-faint">
                {post.location || "Somewhere"}
              </p>

              {post.location && (
                <span className="text-xs text-faint">·</span>
              )}

              <p className="text-xs text-faint">
                {formatPostTime(post.createdAt)}
              </p>
            </div>
          </div>
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-faint hover:text-body p-1"
          >
            <MoreHorizontal size={19} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 bg-panel border border-line shadow-popover rounded-xl py-1 w-36 z-10 text-sm">
               <button
      onClick={async () => {
        setMenuOpen(false);
        try {
          await api.post("/stories", { postId: post._id });
          alert("Added to your story!");
        } catch (err) {
          alert(err?.response?.data?.message || "Could not add to story");
        }
      }}
      className="w-full text-left px-4 py-2 hover:bg-soft"
    >
      Add to Story
    </button>
              {post.author._id === user?._id ? (
                <button
                  onClick={deletePost}
                  className="w-full text-left px-4 py-2 text-red-500 hover:bg-soft"
                >
                  Delete post
                </button>
              ) : (
                <button className="w-full text-left px-4 py-2 hover:bg-soft">
                  Report post
                </button>
                
              )}
            </div>
          )}
        </div>
      </div>

      {post.mediaUrl && (
        <div className="w-full bg-black/5">
          {post.mediaType === "video" ? (
            <video
              src={mediaUrl(post.mediaUrl)}
              controls
              className="w-full max-h-[520px] object-cover"
            />
          ) : (
            <img
              src={mediaUrl(post.mediaUrl)}
              className="w-full max-h-[520px] object-cover"
              alt=""
            />
          )}
        </div>
      )}

      <div className="px-4 py-3.5 flex items-center gap-5 text-body">
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 group"
        >
          <Heart
            size={21}
            className={
              liked
                ? "fill-brand-pink text-brand-pink"
                : "group-hover:text-brand-pink transition"
            }
          />
          <span className="text-sm">{likeCount.toLocaleString()} Like</span>
        </button>

        <button
          onClick={() => setShowComments(true)}
          className="flex items-center gap-1.5 group"
        >
          <MessageCircle
            size={21}
            className="group-hover:text-brand-purple transition"
          />
          <span className="text-sm">{post.commentCount} Comment</span>
        </button>

        <button
          onClick={toggleRepost}
          className="flex items-center gap-1.5 group"
        >
          <Repeat2
            size={21}
            className={
              reposted
                ? "text-green-500"
                : "group-hover:text-green-500 transition"
            }
          />
          <span className="text-sm">{repostCount} Repost</span>
        </button>

        <button
          onClick={toggleSave}
          className="flex items-center gap-1.5 ml-auto group"
        >
          <Bookmark
            size={20}
            className={
              saved
                ? "fill-brand-purple text-brand-purple"
                : "group-hover:text-brand-purple transition"
            }
          />
          <span className="text-sm">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {post.caption && (
        <div className="px-4 pb-4 text-sm">
          <span className="font-semibold mr-1.5">
            {post.author.username}
          </span>
          {post.caption}
        </div>
      )}

      {showComments && (
        <CommentsDrawer
          post={post}
          onClose={() => setShowComments(false)}
          onChange={onChange}
        />
      )}
    </div>
  );
}