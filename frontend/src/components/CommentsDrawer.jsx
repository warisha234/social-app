import { useEffect, useState } from "react";
import {
  X,
  Send,
  Heart,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  Smile,
} from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { mediaUrl } from "../utils/media";

function formatTime(date) {
  const now = new Date();
  const created = new Date(date);

  const diff = Math.floor((now - created) / 1000);

  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;

  return created.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function Avatar({ user, size = "w-9 h-9" }) {
  return (
    <img
      src={
        mediaUrl(user?.avatar) ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${
          user?.username || "user"
        }`
      }
      className={`${size} rounded-full object-cover shrink-0 bg-soft`}
      alt=""
    />
  );
}

export default function CommentsDrawer({ post, onClose, onChange }) {
  const { user } = useAuth();

  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [openMenu, setOpenMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    loadComments();
  }, [post._id]);

  async function loadComments() {
    try {
      setLoading(true);

      const res = await api.get(`/posts/${post._id}/comments`);

      setComments(res.data);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();

    const trimmed = text.trim();

    if (!trimmed || submitting) return;

    try {
      setSubmitting(true);

      const res = await api.post(`/posts/${post._id}/comments`, {
        text: trimmed,
      });

      setComments((current) => [...current, res.data]);
      setText("");

      onChange?.();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike(commentId) {
    try {
      const res = await api.post(
        `/posts/comments/${commentId}/like`
      );

      setComments((current) =>
        current.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                likedByMe: res.data.liked,
                likeCount: res.data.likeCount,
              }
            : comment
        )
      );
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  }

  function startEditing(comment) {
    setEditingId(comment._id);
    setEditText(comment.text);
    setOpenMenu(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditText("");
  }

  async function saveEdit(commentId) {
    const trimmed = editText.trim();

    if (!trimmed) return;

    try {
      const res = await api.patch(
        `/posts/comments/${commentId}`,
        {
          text: trimmed,
        }
      );

      setComments((current) =>
        current.map((comment) =>
          comment._id === commentId ? res.data : comment
        )
      );

      setEditingId(null);
      setEditText("");

      onChange?.();
    } catch (error) {
      console.error("Failed to edit comment:", error);
    }
  }

  async function removeComment(commentId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/posts/comments/${commentId}`);

      setComments((current) =>
        current.filter((comment) => comment._id !== commentId)
      );

      setOpenMenu(null);

      onChange?.();
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-end md:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-panel w-full md:max-w-lg md:rounded-3xl rounded-t-[28px] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-5 py-4 border-b border-line">
          <div className="absolute left-5 w-10 h-1 rounded-full bg-line md:hidden" />

          <div className="text-center">
            <h3 className="font-bold text-base text-body">
              Comments
            </h3>

            {!loading && (
              <p className="text-[11px] text-faint mt-0.5">
                {comments.length}{" "}
                {comments.length === 1 ? "comment" : "comments"}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute right-4 top-3.5 w-9 h-9 rounded-full flex items-center justify-center text-faint hover:text-body hover:bg-soft transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin">
          {loading && (
            <div className="space-y-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 animate-pulse"
                >
                  <div className="w-9 h-9 rounded-full bg-soft shrink-0" />

                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-soft" />
                    <div className="h-3 w-3/4 rounded bg-soft" />
                    <div className="h-2 w-16 rounded bg-soft" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && comments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-soft flex items-center justify-center mb-4">
                <Heart
                  size={28}
                  className="text-faint"
                  strokeWidth={1.6}
                />
              </div>

              <h4 className="font-semibold text-body">
                No comments yet
              </h4>

              <p className="text-sm text-faint mt-1 max-w-[220px]">
                Be the first person to share your thoughts.
              </p>
            </div>
          )}

          {!loading &&
            comments.map((comment) => {
              const isMine =
                comment.author?._id?.toString() ===
                user?._id?.toString();

              const isEditing = editingId === comment._id;

              return (
                <div
                  key={comment._id}
                  className="flex items-start gap-3 group"
                >
                  <Avatar user={comment.author} />

                  <div className="flex-1 min-w-0">
                    {/* Username + Menu */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-sm text-body truncate">
                          {comment.author?.username}
                        </span>

                        {comment.author?._id?.toString() ===
                          post.author?._id?.toString() && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink font-medium">
                            Author
                          </span>
                        )}
                      </div>

                      {isMine && !isEditing && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenu(
                                openMenu === comment._id
                                  ? null
                                  : comment._id
                              )
                            }
                            className="w-7 h-7 rounded-full flex items-center justify-center text-faint hover:text-body hover:bg-soft transition opacity-60 group-hover:opacity-100"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {openMenu === comment._id && (
                            <div className="absolute right-0 top-8 z-20 w-32 bg-panel border border-line rounded-xl shadow-xl overflow-hidden">
                              <button
                                onClick={() =>
                                  startEditing(comment)
                                }
                                className="w-full px-3 py-2.5 flex items-center gap-2 text-sm text-body hover:bg-soft transition"
                              >
                                <Pencil size={15} />
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  removeComment(comment._id)
                                }
                                className="w-full px-3 py-2.5 flex items-center gap-2 text-sm text-red-500 hover:bg-red-500/10 transition"
                              >
                                <Trash2 size={15} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Edit mode */}
                    {isEditing ? (
                      <div className="mt-2">
                        <div className="bg-soft rounded-2xl px-3 py-2.5 border border-brand-pink/30 focus-within:border-brand-pink transition">
                          <textarea
                            value={editText}
                            onChange={(e) =>
                              setEditText(e.target.value)
                            }
                            autoFocus
                            rows={2}
                            maxLength={500}
                            className="w-full bg-transparent text-sm text-body resize-none outline-none"
                          />

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-faint">
                              {editText.length}/500
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1.5 rounded-full text-xs text-faint hover:text-body hover:bg-panel transition"
                              >
                                Cancel
                              </button>

                              <button
                                onClick={() =>
                                  saveEdit(comment._id)
                                }
                                disabled={!editText.trim()}
                                className="px-3 py-1.5 rounded-full text-xs bg-brand-pink text-white disabled:opacity-40 flex items-center gap-1.5 transition"
                              >
                                <Check size={13} />
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Comment text */}
                        <p className="text-sm text-body leading-5 break-words mt-0.5 pr-2">
                          {comment.text}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="text-[11px] text-faint">
                            {formatTime(comment.createdAt)}
                          </span>

                          {comment.updatedAt &&
                            new Date(comment.updatedAt).getTime() >
                              new Date(comment.createdAt).getTime() +
                                1000 && (
                              <span className="text-[10px] text-faint">
                                edited
                              </span>
                            )}

                          <button
                            onClick={() =>
                              toggleLike(comment._id)
                            }
                            className={`flex items-center gap-1 text-[11px] font-medium transition ${
                              comment.likedByMe
                                ? "text-brand-pink"
                                : "text-faint hover:text-brand-pink"
                            }`}
                          >
                            <Heart
                              size={14}
                              fill={
                                comment.likedByMe
                                  ? "currentColor"
                                  : "none"
                              }
                              strokeWidth={
                                comment.likedByMe ? 2.5 : 1.8
                              }
                            />

                            {comment.likeCount > 0 && (
                              <span>{comment.likeCount}</span>
                            )}
                          </button>

                          <button className="text-[11px] text-faint hover:text-body transition font-medium">
                            Reply
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Comment Input */}
        <form
          onSubmit={submit}
          className="px-4 py-3 border-t border-line bg-panel"
        >
          <div className="flex items-center gap-3">
            <Avatar user={user} size="w-9 h-9" />

            <div className="flex-1 flex items-center gap-2 bg-soft rounded-full px-4 py-2.5 border border-transparent focus-within:border-brand-pink/30 transition">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                maxLength={500}
                className="flex-1 min-w-0 bg-transparent text-sm text-body placeholder:text-faint outline-none"
              />

              {text.trim() && (
                <span className="text-[10px] text-faint">
                  {text.length}/500
                </span>
              )}

              <button
                type="button"
                className="text-faint hover:text-brand-pink transition shrink-0"
              >
                <Smile size={19} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="w-10 h-10 rounded-full bg-brand-pink text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition shadow-sm"
            >
              <Send size={17} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// import { useEffect, useState } from "react";
// import { X, Send } from "lucide-react";
// import api from "../api/api";
// import { useAuth } from "../context/AuthContext";
// import { mediaUrl } from "../utils/media";

// export default function CommentsDrawer({ post, onClose, onChange }) {
//   const { user } = useAuth();
//   const [comments, setComments] = useState([]);
//   const [text, setText] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     api
//       .get(`/posts/${post._id}/comments`)
//       .then((res) => setComments(res.data))
//       .finally(() => setLoading(false));
//   }, [post._id]);

//   async function submit(e) {
//     e.preventDefault();
//     if (!text.trim()) return;
//     const res = await api.post(`/posts/${post._id}/comments`, { text });
//     setComments((c) => [...c, res.data]);
//     setText("");
//     onChange?.();
//   }

//   return (
//     <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center animate-fade-in">
//       <div className="bg-panel w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col">
//         <div className="flex items-center justify-between px-4 py-3 border-b border-line">
//           <h3 className="font-semibold text-sm">Comments</h3>
//           <button onClick={onClose} className="text-faint hover:text-body">
//             <X size={20} />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
//           {loading && <p className="text-sm text-faint">Loading comments...</p>}
//           {!loading && comments.length === 0 && (
//             <p className="text-sm text-faint">No comments yet. Say something!</p>
//           )}
//           {comments.map((c) => (
//             <div key={c._id} className="flex items-start gap-3">
//               <img
//                 src={mediaUrl(c.author.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author.username}`}
//                 className="w-8 h-8 rounded-full object-cover"
//                 alt=""
//               />
//               <div>
//                 <p className="text-sm">
//                   <span className="font-semibold mr-1.5">{c.author.username}</span>
//                   {c.text}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>

//         <form onSubmit={submit} className="flex items-center gap-2 px-4 py-3 border-t border-line">
//           <img
//             src={mediaUrl(user?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
//             className="w-8 h-8 rounded-full object-cover"
//             alt=""
//           />
//           <input
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//             placeholder="Write your comment..."
//             className="flex-1 bg-soft rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30"
//           />
//           <button type="submit" className="text-brand-pink">
//             <Send size={19} />
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
