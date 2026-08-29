import {
  useEffect,
  useState,
} from "react";

import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Trash2,
  Send,
  Eye,
  Users,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { mediaUrl } from "../utils/media";

export default function StoryViewer({
  stories,
  startIndex,
  onClose,
  onChange,
}) {
  const { user } = useAuth();

  const [index, setIndex] =
    useState(startIndex);

  const [progress, setProgress] =
    useState(0);

  const [paused, setPaused] =
    useState(false);

  const [localStories, setLocalStories] =
    useState(stories);

  const [replyText, setReplyText] =
    useState("");

  const [replySent, setReplySent] =
    useState(false);

  const [showViewers, setShowViewers] =
    useState(false);

  const current =
    localStories[index];

  const isOwner =
    current.user._id === user._id ||
    current.user._id?.toString() ===
      user._id?.toString();

  useEffect(() => {
    if (!current?._id) return;

    api
      .post(`/stories/${current._id}/view`)
      .then((res) => {
        setLocalStories((list) =>
          list.map((story, i) =>
            i === index
              ? {
                  ...story,
                  viewed: true,
                  viewerCount:
                    res.data.viewerCount ??
                    story.viewerCount,
                }
              : story
          )
        );
      })
      .catch(() => {});

    setProgress(0);
    setReplyText("");
    setReplySent(false);
    setShowViewers(false);
  }, [index]);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }

        return p + 100 / 50;
      });
    }, 100);

    return () =>
      clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused]);

  function next() {
    if (
      index <
      localStories.length - 1
    ) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  }

  function prev() {
    if (index > 0) {
      setIndex(index - 1);
    }
  }

  async function toggleLike() {
    const res = await api.post(
      `/stories/${current._id}/like`
    );

    setLocalStories((list) =>
      list.map((s, i) =>
        i === index
          ? {
              ...s,
              likedByMe:
                res.data.liked,
              likeCount:
                res.data.likeCount,
            }
          : s
      )
    );
  }

  async function handleDelete() {
    if (
      !confirm("Delete this story?")
    )
      return;

    await api.delete(
      `/stories/${current._id}`
    );

    onChange?.();

    const remaining =
      localStories.filter(
        (_, i) => i !== index
      );

    if (remaining.length === 0) {
      onClose();
      return;
    }

    setLocalStories(remaining);

    setIndex((i) =>
      Math.min(
        i,
        remaining.length - 1
      )
    );
  }

  async function sendReply(e) {
    e.preventDefault();

    if (!replyText.trim()) return;

    await api.post(
      `/stories/${current._id}/reply`,
      {
        text: replyText.trim(),
      }
    );

    setReplyText("");
    setReplySent(true);

    setTimeout(
      () => setReplySent(false),
      1800
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in">
      {/* CLOSE */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white/80 hover:text-white z-50"
      >
        <X size={26} />
      </button>

      {/* PREVIOUS */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-10 text-white/60 hover:text-white z-50"
      >
        <ChevronLeft size={32} />
      </button>

      {/* NEXT */}
      <button
        onClick={next}
        className="absolute right-4 md:right-10 text-white/60 hover:text-white z-50"
      >
        <ChevronRight size={32} />
      </button>

      {/* STORY */}
      <div
        className="w-full max-w-sm h-[80vh] rounded-2xl overflow-hidden relative bg-neutral-900"
        onMouseDown={() =>
          setPaused(true)
        }
        onMouseUp={() =>
          setPaused(false)
        }
        onMouseLeave={() =>
          setPaused(false)
        }
        onTouchStart={() =>
          setPaused(true)
        }
        onTouchEnd={() =>
          setPaused(false)
        }
      >
        {/* PROGRESS */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
          {localStories.map(
            (_, i) => (
              <div
                key={i}
                className="h-1 flex-1 bg-white/30 rounded overflow-hidden"
              >
                <div
                  className="h-full bg-white"
                  style={{
                    width:
                      i < index
                        ? "100%"
                        : i === index
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            )
          )}
        </div>

        {/* HEADER */}
        <div className="absolute top-6 left-3 right-3 flex items-center gap-2 z-20">
          <img
            src={
              mediaUrl(
                current.user.avatar
              ) ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${current.user.username}`
            }
            className="w-8 h-8 rounded-full border border-white/40"
            alt=""
          />

          <span className="text-white text-sm font-medium drop-shadow">
            {current.user.username}
          </span>

          {isOwner && (
            <button
              onClick={handleDelete}
              className="ml-auto text-white/70 hover:text-red-400 p-1.5"
              title="Delete story"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* MEDIA */}
        {current.mediaType ===
        "video" ? (
          <video
            src={mediaUrl(
              current.mediaUrl
            )}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={mediaUrl(
              current.mediaUrl
            )}
            className="w-full h-full object-cover"
            alt=""
          />
        )}

        {/* OWNER VIEW COUNT */}
        {isOwner && (
          <button
            onClick={() =>
              setShowViewers(true)
            }
            className="absolute bottom-16 left-4 flex items-center gap-2 text-white z-30 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2 hover:bg-black/50 transition"
          >
            <Eye
              size={16}
              className="text-white"
            />

            <span className="text-sm">
              {current.viewerCount} views
            </span>
          </button>
        )}

        {/* BOTTOM */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2 z-20 bg-gradient-to-t from-black/70 to-transparent">
          <button
            onClick={toggleLike}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <Heart
              size={22}
              className={
                current.likedByMe
                  ? "fill-brand-pink text-brand-pink"
                  : "text-white"
              }
            />
          </button>

          {!isOwner && (
            <form
              onSubmit={sendReply}
              className="flex-1 flex items-center gap-2"
            >
              <input
                value={replyText}
                onChange={(e) =>
                  setReplyText(
                    e.target.value
                  )
                }
                onFocus={() =>
                  setPaused(true)
                }
                onBlur={() =>
                  setPaused(false)
                }
                placeholder={
                  replySent
                    ? "Reply sent ✓"
                    : "Reply..."
                }
                className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-full px-4 py-2 text-sm outline-none border border-white/20 focus:border-white/50"
              />

              <button
                type="submit"
                className="text-white p-2 rounded-full hover:bg-white/10"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </div>

        {/* VIEWERS MODAL */}
        {showViewers &&
          isOwner && (
            <div
              className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >
              <div className="w-full max-h-[65%] bg-neutral-950 rounded-t-3xl overflow-hidden">
                {/* VIEWER HEADER */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Users
                      size={19}
                      className="text-white"
                    />

                    <h3 className="text-white font-semibold">
                      Story viewers
                    </h3>

                    <span className="text-white/50 text-sm">
                      {current.viewerCount}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setShowViewers(false)
                    }
                    className="text-white/70 hover:text-white"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* VIEWER LIST */}
                <div className="overflow-y-auto max-h-[50vh] p-3">
                  {current.viewers?.length >
                  0 ? (
                    current.viewers.map(
                      (viewer) => (
                        <div
                          key={
                            viewer._id
                          }
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5"
                        >
                          <img
                            src={
                              mediaUrl(
                                viewer.avatar
                              ) ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewer.username}`
                            }
                            className="w-11 h-11 rounded-full object-cover"
                            alt=""
                          />

                          <div>
                            <p className="text-white text-sm font-medium">
                              {
                                viewer.username
                              }
                            </p>

                            <p className="text-white/40 text-xs">
                              Viewed your story
                            </p>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="py-10 text-center">
                      <Eye
                        size={30}
                        className="mx-auto text-white/30 mb-2"
                      />

                      <p className="text-white/60 text-sm">
                        No views yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}