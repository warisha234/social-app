import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { mediaUrl } from "../utils/media";

export default function FollowListModal({ userId, type, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/users/${userId}/${type}`)
      .then((res) => setList(res.data))
      .finally(() => setLoading(false));
  }, [userId, type]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm max-h-[70vh] bg-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h2 className="font-semibold text-body capitalize">{type}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-soft">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-2">
          {loading && <p className="text-sm text-faint text-center py-6">Loading...</p>}

          {!loading && list.length === 0 && (
            <p className="text-sm text-faint text-center py-6">No {type} yet.</p>
          )}

          {list.map((u) => (
            <Link
              key={u._id}
              to={`/profile/${u.username}`}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-soft"
            >
              <img
                src={mediaUrl(u.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                className="w-10 h-10 rounded-full object-cover"
                alt=""
              />
              <div>
                <p className="text-sm font-semibold">{u.username}</p>
                <p className="text-xs text-faint">{u.fullName}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}