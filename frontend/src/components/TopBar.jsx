import { useEffect, useRef, useState } from "react";
import { Search, Bell, Send, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { mediaUrl } from "../utils/media";

export default function TopBar({ onMenuClick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search`, {
          params: { q: query },
        });

        setResults(res.data);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  return (
    <header className="sticky top-0 z-30 bg-panel/90 backdrop-blur border-b border-line px-4 md:px-8 py-3 flex items-center gap-4">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-full text-faint hover:bg-soft hover:text-body transition shrink-0"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Search */}
      <div
        ref={boxRef}
        className="relative flex-1 max-w-md"
      >
        <Search
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
        />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search people, tags..."
          className="w-full bg-soft rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30 transition"
        />

        {open && results.length > 0 && (
          <div className="absolute mt-2 w-full bg-panel rounded-2xl shadow-popover border border-line py-2 max-h-80 overflow-y-auto animate-fade-in">
            {results.map((u) => (
              <button
                key={u._id}
                onClick={() => {
                  navigate(`/profile/${u.username}`);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-soft text-left"
              >
                <img
                  src={
                    mediaUrl(u.avatar) ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
                  }
                  className="w-9 h-9 rounded-full object-cover"
                  alt=""
                />

                <div>
                  <p className="text-sm font-semibold">
                    {u.username}
                  </p>

                  <p className="text-xs text-faint">
                    {u.fullName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {open && query && results.length === 0 && (
          <div className="absolute mt-2 w-full bg-panel rounded-2xl shadow-popover border border-line py-4 px-4 text-sm text-faint">
            No account found for "{query}"
          </div>
        )}
      </div>

      {/* Desktop + Mobile actions */}
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => navigate("/messages")}
          className="p-2.5 rounded-full hover:bg-soft text-body relative"
        >
          <Send size={19} />
        </button>

        <button
          onClick={() => navigate("/notifications")}
          className="p-2.5 rounded-full hover:bg-soft text-body relative"
        >
          <Bell size={19} />

          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-pink" />
        </button>
      </div>
    </header>
  );
}