import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import api from "../api/api";

export default function CreatePost() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setMediaType(f.type.startsWith("video") ? "video" : "image");
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please add a photo or video first.");
      return;
    }
    setPosting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("media", file);
      form.append("caption", caption);
      form.append("location", location);
      await api.post("/posts", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-display font-bold text-xl mb-6">Create new post</h2>

      <form onSubmit={handleSubmit} className="bg-panel rounded-2xl shadow-card border border-line p-5 flex flex-col gap-4">
        {!preview ? (
          <label className="border-2 border-dashed border-line rounded-xl h-64 flex flex-col items-center justify-center gap-2 text-faint cursor-pointer hover:border-brand-pink hover:text-brand-pink transition">
            <ImagePlus size={30} />
            <span className="text-sm font-medium">Click to upload a photo or video</span>
            <input type="file" accept="image/*,video/*" hidden onChange={handleFile} />
          </label>
        ) : (
          <div className="relative rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
              }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 z-10"
            >
              <X size={16} />
            </button>
            {mediaType === "video" ? (
              <video src={preview} controls className="w-full max-h-80 object-cover" />
            ) : (
              <img src={preview} className="w-full max-h-80 object-cover" alt="" />
            )}
          </div>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={3}
          className="bg-soft rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30 resize-none"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Add location (optional)"
          className="bg-soft rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          disabled={posting}
          className="btn-gradient text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-60"
        >
          {posting ? "Sharing..." : "Share post"}
        </button>
      </form>
    </div>
  );
}
