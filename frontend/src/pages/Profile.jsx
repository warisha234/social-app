import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Grid, Bookmark, Repeat2, MessageCircle } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import EditProfileModal from "../components/EditProfileModal";
import FollowListModal from "../components/FollowListModal";
import { mediaUrl } from "../utils/media";

const TABS = [
  { key: "posts", label: "Posts", icon: Grid },
  { key: "reposts", label: "Reposts", icon: Repeat2 },
  { key: "saved", label: "Saved", icon: Bookmark },
];

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
   const [followModal, setFollowModal] = useState(null);

  const isMe = profile?._id === me?._id;

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await api.get(`/users/${username}`);
      setProfile(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function loadTab() {
    if (!profile) return;
    const endpointMap = {
      posts: `/users/${profile._id}/posts`,
      reposts: `/users/${profile._id}/reposts`,
      saved: `/users/${profile._id}/saved`,
    };
    const res = await api.get(endpointMap[tab]);
    setPosts(res.data);
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    loadTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, tab]);

  async function toggleFollow() {
    await api.post(`/users/${profile._id}/follow`);
    setProfile((p) => ({
      ...p,
      isFollowing: !p.isFollowing,
      followerCount: p.isFollowing ? p.followerCount - 1 : p.followerCount + 1,
    }));
  }

  if (loading || !profile) return <p className="text-sm text-faint">Loading profile...</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-panel rounded-2xl shadow-card border border-line p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <img
          src={mediaUrl(profile.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-card"
          alt=""
        />
        <div className="flex-1 w-full">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="font-display font-bold text-xl">{profile.username}</h2>
            {isMe ? (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-soft hover:bg-soft transition"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFollow}
                  className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition ${
                    profile.isFollowing
                      ? "bg-soft hover:bg-soft"
                      : "btn-gradient text-white"
                  }`}
                >
                  {profile.isFollowing ? "Unfollow" : "Follow"}
                </button>
                <button
                  onClick={() => navigate(`/messages?user=${profile.username}`)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg bg-soft hover:bg-soft transition"
                >
                  <MessageCircle size={15} /> Message
                </button>
              </div>
            )}
          </div>
          <p className="text-faint text-sm mb-3">{profile.fullName}</p>

                   <div className="flex gap-6 mb-3 text-sm">
            <span><b>{profile.postCount || 0}</b> Posts</span>
            <button onClick={() => setFollowModal("followers")} className="hover:underline">
              <b>{profile.followerCount || 0}</b> Followers
            </button>
            <button onClick={() => setFollowModal("following")} className="hover:underline">
              <b>{profile.followingCount || 0}</b> Following
            </button>
          </div>

          {profile.bio && <p className="text-sm text-body leading-relaxed">{profile.bio}</p>}
          {profile.note && (
            <p className="text-xs text-brand-pink mt-2 italic">"{profile.note}"</p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-8 border-b border-line">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition ${
              tab === key ? "border-brand-pink text-brand-pink" : "border-transparent text-faint"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {posts.length === 0 && (
          <p className="text-center text-faint text-sm py-10">Nothing here yet.</p>
        )}
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onChange={loadTab} />
        ))}
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(patch) => {
            setProfile((p) => ({ ...p, ...patch }));
            updateUser(patch);
            setEditOpen(false);
          }}
          
        />
      )}
       {followModal && (
        <FollowListModal
          userId={profile._id}
          type={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}
