import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import api from "../api/api";
import { mediaUrl } from "../utils/media";

export default function Explore() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get("/posts/explore").then((res) => setPosts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get("/users/search", { params: { q: query } }).then((res) => setResults(res.data));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Sirf wo posts rakho jinka author valid hai (null author wale skip)
  const validPosts = posts.filter((p) => p && p.author);

  return (
    <div>
      <div className="relative mb-6">
        <SearchIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or name..."
          className="w-full bg-soft rounded-full pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30"
        />
      </div>

      {query && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-faint mb-3">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </h3>
          <div className="flex flex-col gap-2">
            {results.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u.username}`}
                className="flex items-center gap-3 bg-panel rounded-xl px-4 py-3 shadow-card border border-line"
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
            {results.length === 0 && (
              <p className="text-sm text-faint">
                No account found for "{query}"
              </p>
            )}
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-faint mb-3">Explore</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {validPosts.map((p) => (
          <Link key={p._id} to={`/profile/${p.author.username}`} className="aspect-square rounded-xl overflow-hidden bg-soft">
            {p.mediaType === "video" ? (
              <video src={mediaUrl(p.mediaUrl)} className="w-full h-full object-cover" muted />
            ) : (
              <img src={mediaUrl(p.mediaUrl)} className="w-full h-full object-cover" alt="" />
            )}
          </Link>
        ))}
        {validPosts.length === 0 && (
          <p className="text-sm text-faint col-span-full">No posts to explore yet.</p>
        )}
      </div>
    </div>
  );
}