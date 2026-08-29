import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { mediaUrl } from "../utils/media";

export default function RightSidebar() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    api.get("/users/suggestions").then((res) => setSuggestions(res.data)).catch(() => {});
  }, []);

  async function follow(id) {
    await api.post(`/users/${id}/follow`);
    setSuggestions((s) => s.filter((u) => u._id !== id));
  }

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 h-screen sticky top-0 py-6 px-5 gap-6 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-body mb-3">Suggestions for you</h3>
        <div className="flex flex-col gap-3">
          {suggestions.slice(0, 5).map((u) => (
            <div key={u._id} className="flex items-center gap-3">
              <Link to={`/profile/${u.username}`}>
                <img
                  src={mediaUrl(u.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                  className="w-9 h-9 rounded-full object-cover"
                  alt=""
                />
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.username}</p>
                <p className="text-xs text-faint truncate">{u.fullName}</p>
              </div>
              <button
                onClick={() => follow(u._id)}
                className="text-xs font-semibold text-brand-pink hover:text-brand-purple"
              >
                Follow
              </button>
            </div>
          ))}
          {suggestions.length === 0 && (
            <p className="text-xs text-faint">No suggestions right now.</p>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-brand-pink/10 dark:to-brand-purple/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={mediaUrl(user?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
            className="w-9 h-9 rounded-full object-cover border-2 border-white"
            alt=""
          />
          <div>
            <p className="text-lg font-bold leading-tight">
              {(user?.followerCount || 0).toLocaleString()}
            </p>
            <p className="text-xs text-faint">Followers</p>
          </div>
        </div>
        <p className="text-xs text-faint leading-relaxed">
          Keep posting to grow your reach — try sharing a story today.
        </p>
      </div>
    </aside>
  );
}
