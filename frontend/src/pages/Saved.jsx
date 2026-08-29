import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

export default function Saved() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    if (!user) return;
    setLoading(true);
    api
      .get(`/users/${user._id}/saved`)
      .then((res) => setPosts(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user]);

  return (
    <div>
      <h2 className="font-display font-bold text-xl mb-6">My Favorites</h2>
      {loading && <p className="text-sm text-faint">Loading...</p>}
      {!loading && posts.length === 0 && (
        <p className="text-sm text-faint">You haven't saved any posts yet.</p>
      )}
      <div className="flex flex-col gap-5">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onChange={load} />
        ))}
      </div>
    </div>
  );
}
