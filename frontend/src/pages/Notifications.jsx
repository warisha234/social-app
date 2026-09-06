import { useEffect, useState } from "react";
import { Heart, MessageCircle, UserPlus, Repeat2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { mediaUrl } from "../utils/media";

const ICONS = {
  like: { icon: Heart, color: "text-brand-pink" },
  comment: { icon: MessageCircle, color: "text-brand-purple" },
  follow: { icon: UserPlus, color: "text-green-500" },
  repost: { icon: Repeat2, color: "text-blue-500" },
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/notifications")
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, []);

  // FIX: null actor wali notifications hata do
  const validItems = items.filter((n) => n && n.actor);

  return (
    <div>
      <h2 className="font-display font-bold text-xl mb-6">Notifications</h2>
      {loading && <p className="text-sm text-faint">Loading...</p>}
      {!loading && validItems.length === 0 && (
        <p className="text-sm text-faint">You're all caught up.</p>
      )}
      <div className="flex flex-col gap-1">
        {validItems.map((n) => {
          const cfg = ICONS[n.type] || ICONS.like;
          const Icon = cfg.icon;
          return (
            <Link
              to={n.type === "follow" ? `/profile/${n.actor.username}` : `/`}
              key={n._id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-soft"
            >
              <img
                src={mediaUrl(n.actor.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.actor.username}`}
                className="w-10 h-10 rounded-full object-cover"
                alt=""
              />
              <Icon size={16} className={cfg.color} />
              <p className="text-sm flex-1">
                <span className="font-semibold">{n.actor.username}</span> {n.text}
              </p>
              <span className="text-xs text-faint">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}