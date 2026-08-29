import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  Bookmark,
  Send,
  Film,
  BarChart2,
  Settings,
  LogOut,
  PlusSquare,
  UserCircle,
  Gamepad2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { mediaUrl } from "../utils/media";


const navItems = [
  { to: "/", label: "Feed", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/saved", label: "My Favorites", icon: Bookmark },
  { to: "/messages", label: "Direct", icon: Send },
  { to: "/reels", label: "IG TV", icon: Film },
  { to: "/stats", label: "Stats", icon: BarChart2 },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/settings", label: "Setting", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-line bg-panel px-5 py-6">
      <div className="flex items-center gap-2 px-1 mb-8">
        <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center text-white font-display font-bold">
          ɮ
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-body">
           Vibgram
        </span>
      </div>

      <button
        onClick={() => navigate("/create")}
        className="flex items-center gap-2 mb-6 text-sm font-semibold text-white btn-gradient rounded-full py-2.5 px-4 justify-center shadow-card hover:opacity-90 transition"
      >
        <PlusSquare size={17} /> Create new Post
      </button>

      {user && (
        <NavLink
          to={`/profile/${user.username}`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition relative mb-1 ${
              isActive
                ? "text-brand-pink bg-pink-50 dark:bg-brand-pink/10"
                : "text-faint hover:bg-soft hover:text-body"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-brand-pink" />
              )}
              {user.avatar ? (
                <img
                  src={mediaUrl(user.avatar)}
                  className="w-[19px] h-[19px] rounded-full object-cover"
                  alt=""
                />
              ) : (
                <UserCircle size={19} />
              )}
              My Profile
            </>
          )}
        </NavLink>
      )}

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition relative ${
                isActive
                  ? "text-brand-pink bg-pink-50 dark:bg-brand-pink/10"
                  : "text-faint hover:bg-soft hover:text-body"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-brand-pink" />
                )}
                <Icon size={19} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-faint hover:bg-soft hover:text-body transition mt-2"
      >
        <LogOut size={19} /> Log out
      </button>
    </aside>
  );
}
