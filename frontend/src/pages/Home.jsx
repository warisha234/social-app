import { useEffect, useState } from "react";
import api from "../api/api";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";

export default function Home() {
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("latest");

  async function loadStories() {
    const res = await api.get("/stories/feed");
    setStories(res.data);
  }

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await api.get("/posts/feed", { params: { sort: filter } });
      setPosts(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="flex flex-col gap-6">
      <StoriesBar stories={stories} onUploaded={loadStories} />

      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Feeds</h2>
        <div className="flex bg-soft rounded-full p-1 text-sm">
          {["latest", "popular"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full capitalize transition ${
                filter === f ? "bg-panel shadow-card font-semibold" : "text-faint"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-faint">Loading feed...</p>}
      {!loading && posts.length === 0 && (
        <div className="text-center py-16 text-faint text-sm">
          No posts yet — follow people or create your first post.
        </div>
      )}

      <div className="flex flex-col gap-5">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onChange={loadPosts} />
        ))}
      </div>
    </div>
  );
}
