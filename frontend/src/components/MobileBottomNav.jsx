import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  PlusSquare,
  Gamepad2,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { mediaUrl } from "../utils/media";

export default function MobileBottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: "/", label: "Feed", icon: Home, end: true },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/create", label: "Create", icon: PlusSquare },
    { to: "/games", label: "Games", icon: Gamepad2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-panel/95 backdrop-blur-xl border-t border-line">
      <div
        className="flex items-center justify-around h-[64px] px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 min-w-[58px] h-full transition ${
                isActive
                  ? "text-brand-pink"
                  : "text-faint active:text-body"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={() => {
            if (user?.username) {
              navigate(`/profile/${user.username}`);
            }
          }}
          className="flex flex-col items-center justify-center gap-1 min-w-[58px] h-full text-faint active:text-body"
        >
          {user?.avatar ? (
            <img
              src={mediaUrl(user.avatar)}
              alt=""
              className="w-[23px] h-[23px] rounded-full object-cover"
            />
          ) : (
            <UserCircle size={22} />
          )}

          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );
}