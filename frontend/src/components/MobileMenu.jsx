import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  X,
  Bookmark,
  Send,
  Film,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { to: "/saved", label: "My Favorites", icon: Bookmark },
  { to: "/messages", label: "Direct", icon: Send },
  { to: "/reels", label: "IG TV", icon: Film },
  { to: "/stats", label: "Stats", icon: BarChart2 },
  { to: "/settings", label: "Setting", icon: Settings },
];

export default function MobileMenu({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  function handleLogout() {
    logout();
    onClose();
    navigate("/login");
  }

  return (
    <div className="md:hidden fixed inset-0 z-[60]">
      {/* Overlay */}
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      {/* Drawer */}
      <aside className="absolute left-0 top-0 bottom-0 w-[285px] max-w-[82vw] bg-panel shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center text-white font-display font-bold">
              §
            </div>

            <span className="font-display font-bold text-lg tracking-tight text-body">
              LifeGram
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-soft text-faint hover:text-body transition"
          >
            <X size={21} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-5 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {menuItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "text-brand-pink bg-pink-50 dark:bg-brand-pink/10"
                      : "text-faint hover:bg-soft hover:text-body"
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="px-4 pb-6 pt-3 border-t border-line">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-faint hover:bg-soft hover:text-body transition"
          >
            <LogOut size={20} />
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}