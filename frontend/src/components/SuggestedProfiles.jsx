import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { mediaUrl } from "../utils/media";

export default function SuggestedProfiles() {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    api.get("/users/suggestions").then((res) => setSuggestions(res.data)).catch(() => {});
  }, []);

  async function follow(id) {
    await api.post(`/users/${id}/follow`);
    setSuggestions((s) => s.filter((u) => u._id !== id));
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="lg:hidden">
      <h3 className="text-sm font-semibold text-faint mb-3">Suggested for you</h3>
      <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
        {suggestions.map((u) => (
          <div
            key={u._id}
            className="flex flex-col items-center gap-2 shrink-0 w-24 bg-panel rounded-xl border border-line p-3"
          >
            <Link to={`/profile/${u.username}`}>
              <img
                src={mediaUrl(u.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                className="w-14 h-14 rounded-full object-cover"
                alt=""
              />
            </Link>
            <p className="text-xs font-semibold truncate w-full text-center">{u.username}</p>
            <button
              onClick={() => follow(u._id)}
              className="text-xs font-semibold text-white bg-brand-pink rounded-full px-3 py-1 w-full"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}