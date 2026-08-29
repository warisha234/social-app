import { useState } from "react";
import { X } from "lucide-react";
import api from "../api/api";
import { mediaUrl } from "../utils/media";

export default function EditProfileModal({ profile, onClose, onSaved }) {
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [note, setNote] = useState(profile.note || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(mediaUrl(profile.avatar));
  const [saving, setSaving] = useState(false);

  function handleAvatar(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const form = new FormData();
      form.append("fullName", fullName);
      form.append("bio", bio);
      form.append("note", note);
      if (avatarFile) form.append("avatar", avatarFile);
      const res = await api.put("/users/me", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSaved(res.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-fade-in px-4">
      <div className="bg-panel rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg">Edit profile</h3>
          <button onClick={onClose} className="text-faint hover:text-body">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <img src={preview} className="w-16 h-16 rounded-full object-cover" alt="" />
            <label className="text-sm font-semibold text-brand-pink cursor-pointer">
              Change photo
              <input type="file" accept="image/*" hidden onChange={handleAvatar} />
            </label>
          </div>

          <div>
            <label className="text-xs text-faint mb-1 block">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-soft rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30"
            />
          </div>

          <div>
            <label className="text-xs text-faint mb-1 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-soft rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-faint mb-1 block">Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={60}
              placeholder="Share a thought..."
              className="w-full bg-soft rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30"
            />
          </div>

          <button
            disabled={saving}
            className="btn-gradient text-white font-semibold text-sm rounded-xl py-2.5 mt-2 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
