import { Plus, Image, Video, Type, X, Upload, Music, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { mediaUrl } from "../utils/media";
import StoryViewer from "./StoryViewer";

export default function StoriesBar({ stories, onUploaded }) {
  const { user } = useAuth();

  const fileRef = useRef(null);
  const musicRef = useRef(null);

  const [viewerIndex, setViewerIndex] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [caption, setCaption] = useState("");
  const [musicFile, setMusicFile] = useState(null);

  const [textStory, setTextStory] = useState("");
  const [textBg, setTextBg] = useState("#111827");

  const [mode, setMode] = useState("media");

  const backgrounds = [
    "#111827",
    "#7c3aed",
    "#db2777",
    "#dc2626",
    "#ea580c",
    "#ca8a04",
    "#059669",
    "#0891b2",
  ];

  // ---- FIX: null/invalid user wali stories hatao, aur duplicate _id bhi hatao ----
  const seenIds = new Set();
  const validStories = (stories || []).filter((s) => {
    if (!s || !s.user || !s._id) return false;
    if (seenIds.has(s._id)) return false; // duplicate id skip
    seenIds.add(s._id);
    return true;
  });

  function openComposer() {
    setShowComposer(true);
    setMode("media");
    setSelectedFile(null);
    setPreview(null);
    setTextStory("");
    setCaption("");
    setMusicFile(null);
  }

  function closeComposer() {
    if (uploading) return;

    setShowComposer(false);
    setSelectedFile(null);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setTextStory("");
    setCaption("");
    setMusicFile(null);
  }

  function chooseMedia(type) {
    setMode(type);

    if (fileRef.current) {
      fileRef.current.accept =
        type === "image"
          ? "image/*"
          : "video/*";

      fileRef.current.click();
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (mode === "video") {
      if (!file.type.startsWith("video/")) {
        alert("Please select a video.");
        return;
      }
    }

    if (mode === "image") {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image.");
        return;
      }
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));

    e.target.value = "";
  }

  function handleMusic(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file.");
      return;
    }

    setMusicFile(file);
    e.target.value = "";
  }

  async function uploadStory(file, type) {
    setUploading(true);

    try {
      const form = new FormData();

      form.append("media", file);

      if (caption.trim()) {
        form.append("caption", caption.trim());
      }

      if (musicFile) {
        form.append("music", musicFile);
      }

      await api.post("/stories", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onUploaded?.();
      closeComposer();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Could not upload story"
      );
    } finally {
      setUploading(false);
    }
  }

  async function createTextStory() {
    if (!textStory.trim()) {
      alert("Write something first.");
      return;
    }

    setUploading(true);

    try {
      const canvas = document.createElement("canvas");

      canvas.width = 1080;
      canvas.height = 1920;

      const ctx = canvas.getContext("2d");

      ctx.fillStyle = textBg;
      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const maxWidth = 850;
      const fontSize = 72;

      ctx.font = `600 ${fontSize}px Arial`;

      const words = textStory.trim().split(/\s+/);
      const lines = [];
      let line = "";

      words.forEach((word) => {
        const test = line
          ? `${line} ${word}`
          : word;

        if (
          ctx.measureText(test).width >
          maxWidth
        ) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      });

      if (line) {
        lines.push(line);
      }

      const lineHeight = 100;

      const startY =
        canvas.height / 2 -
        ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((lineText, i) => {
        ctx.fillText(
          lineText,
          canvas.width / 2,
          startY + i * lineHeight
        );
      });

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setUploading(false);
            return;
          }

          const file = new File(
            [blob],
            `text-story-${Date.now()}.jpg`,
            {
              type: "image/jpeg",
            }
          );

          await uploadStory(file, "image");
        },
        "image/jpeg",
        0.92
      );
    } catch (err) {
      console.error(err);
      setUploading(false);
      alert("Could not create text story.");
    }
  }

  async function trimVideoTo15Seconds(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");

      const url = URL.createObjectURL(file);

      video.src = url;
      video.preload = "metadata";
      video.playsInline = true;

      video.onloadedmetadata = async () => {
        if (video.duration <= 15) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }

        try {
          const stream =
            video.captureStream?.();

          if (!stream) {
            URL.revokeObjectURL(url);
            reject(
              new Error(
                "Video trimming is not supported in this browser."
              )
            );
            return;
          }

          const mimeTypes = [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm",
          ];

          const mimeType =
            mimeTypes.find((type) =>
              MediaRecorder.isTypeSupported(type)
            ) || "";

          const recorder = new MediaRecorder(
            stream,
            mimeType
              ? { mimeType }
              : undefined
          );

          const chunks = [];

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          recorder.onerror = () => {
            URL.revokeObjectURL(url);
            reject(
              new Error("Could not process video.")
            );
          };

          recorder.onstop = () => {
            const blob = new Blob(chunks, {
              type:
                mimeType || "video/webm",
            });

            URL.revokeObjectURL(url);

            resolve(
              new File(
                [blob],
                `story-${Date.now()}.webm`,
                {
                  type:
                    mimeType ||
                    "video/webm",
                }
              )
            );
          };

          video.currentTime = 0;

          await video.play();

          recorder.start();

          setTimeout(() => {
            video.pause();

            if (
              recorder.state !== "inactive"
            ) {
              recorder.stop();
            }
          }, 15000);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(
          new Error("Invalid video file.")
        );
      };
    });
  }

  async function postSelectedMedia() {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    try {
      let file = selectedFile;

      if (
        selectedFile.type.startsWith("video/")
      ) {
        file = await trimVideoTo15Seconds(
          selectedFile
        );
      }

      await uploadStory(
        file,
        selectedFile.type.startsWith("video/")
          ? "video"
          : "image"
      );
    } catch (error) {
      console.error(error);

      setUploading(false);

      alert(
        error?.message ||
          "Could not process video."
      );
    }
  }

  return (
    <>
      <div className="flex gap-5 overflow-x-auto scrollbar-none py-1">
        {/* ADD STORY */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button
            onClick={openComposer}
            className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center text-faint hover:border-brand-pink hover:text-brand-pink transition"
          >
            <Plus size={22} />
          </button>

          <span className="text-xs text-faint">
            Add story
          </span>
        </div>

        {/* STORIES */}
        {validStories.map((s, i) => (
          <div
            key={s._id}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <button
              onClick={() =>
                setViewerIndex(i)
              }
              className={
                s.viewed
                  ? "story-ring-seen"
                  : "story-ring"
              }
            >
              <img
                src={
                  mediaUrl(s.user.avatar) ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.user.username}`
                }
                className="w-14 h-14 rounded-full object-cover border-2 border-white"
                alt={s.user.username}
              />
            </button>

            <span className="text-xs text-body max-w-[64px] truncate">
              {s.user.username}
            </span>
          </div>
        ))}

        {viewerIndex !== null && (
          <StoryViewer
            stories={validStories}
            startIndex={viewerIndex}
            onClose={() =>
              setViewerIndex(null)
            }
            onChange={onUploaded}
          />
        )}
      </div>

      {/* STORY COMPOSER */}
      {showComposer && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
        <div className="w-full max-w-md max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl overflow-y-auto shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="font-semibold text-body">
                Create Story
              </h2>

              <button
                onClick={closeComposer}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* OPTIONS */}
            <div className="grid grid-cols-3 gap-2 p-4">
              <button
                onClick={() =>
                  chooseMedia("image")
                }
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-brand-pink"
              >
                <Image size={24} />
                <span className="text-sm">
                  Photo
                </span>
              </button>

              <button
                onClick={() =>
                  chooseMedia("video")
                }
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-brand-pink"
              >
                <Video size={24} />
                <span className="text-sm">
                  Video
                </span>
              </button>

              <button
                onClick={() => {
                  setMode("text");
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-brand-pink"
              >
                <Type size={24} />
                <span className="text-sm">
                  Aa Text
                </span>
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={handleFile}
            />

            {/* PREVIEW */}
            {preview && mode !== "text" && (
              <div className="mx-4 h-[420px] bg-black rounded-xl overflow-hidden">
                {selectedFile?.type.startsWith(
                  "video/"
                ) ? (
                  <video
                    src={preview}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={preview}
                    className="w-full h-full object-contain"
                    alt="Story preview"
                  />
                )}
              </div>
            )}

            {/* CAPTION + MUSIC */}
            {preview && mode !== "text" && (
              <div className="px-4 mt-3 flex flex-col gap-3">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={200}
                  placeholder="Add a caption..."
                  rows={2}
                  className="w-full border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-transparent text-body text-sm outline-none focus:border-brand-pink resize-none"
                />

                <input
                  ref={musicRef}
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={handleMusic}
                />

                {musicFile ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <Music size={16} className="text-brand-pink shrink-0" />
                    <span className="text-sm truncate flex-1">
                      {musicFile.name}
                    </span>
                    <button
                      onClick={() => setMusicFile(null)}
                      className="text-faint hover:text-red-500 p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => musicRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-sm text-faint hover:border-brand-pink hover:text-brand-pink transition"
                  >
                    <Music size={16} />
                    Add music
                  </button>
                )}
              </div>
            )}

            {/* TEXT STORY */}
            {mode === "text" && (
              <div className="px-4">
                <div
                  className="h-[300px] rounded-xl flex items-center justify-center p-6"
                  style={{
                    backgroundColor: textBg,
                  }}
                >
                  <p className="text-white text-2xl font-semibold text-center break-words">
                    {textStory ||
                      "Write your story..."}
                  </p>
                </div>

                <textarea
                  value={textStory}
                  onChange={(e) =>
                    setTextStory(e.target.value)
                  }
                  maxLength={300}
                  placeholder="Write something..."
                  className="mt-3 w-full border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-transparent text-body outline-none focus:border-brand-pink resize-none"
                  rows={3}
                />

                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {backgrounds.map((bg) => (
                    <button
                      key={bg}
                      onClick={() =>
                        setTextBg(bg)
                      }
                      className="w-8 h-8 rounded-full border-2 border-white shadow shrink-0"
                      style={{
                        backgroundColor: bg,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* POST BUTTON */}
            <div className="p-4">
              <button
                disabled={uploading}
                onClick={
                  mode === "text"
                    ? createTextStory
                    : postSelectedMedia
                }
                className="w-full py-3 rounded-xl bg-brand-pink text-white font-semibold disabled:opacity-50"
              >
                {uploading
                  ? "Posting..."
                  : "Share to Story"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}