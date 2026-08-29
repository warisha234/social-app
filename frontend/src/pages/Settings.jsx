import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, UserX, Trash2, ShieldCheck, SunMoon, Sun, Moon, Monitor } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState("account");
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [privatAccount, setPrivateAccount] = useState(user?.isPrivate || false);

  async function changePassword(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.put("/users/me/password", {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setMsg("Password updated successfully.");
      setPasswords({ current: "", next: "" });
    } catch (err) {
      setMsg(err?.response?.data?.message || "Could not update password.");
    }
  }

  async function togglePrivacy() {
    const next = !privatAccount;
    setPrivateAccount(next);
    await api.put("/users/me", { isPrivate: next });
  }

  async function deactivate() {
    await api.post("/users/me/deactivate");
    logout();
    navigate("/login");
  }

  async function deleteAccount() {
    await api.post("/users/me/delete", { password: deletePassword });
    logout();
    navigate("/login");
  }

  const tabs = [
    { key: "account", label: "Account", icon: ShieldCheck },
    { key: "appearance", label: "Appearance", icon: SunMoon },
    { key: "password", label: "Password", icon: Lock },
    { key: "danger", label: "Deactivate / Delete", icon: UserX },
  ];

  return (
    <div className="max-w-xl">
      <h2 className="font-display font-bold text-xl mb-6">Settings</h2>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition ${
              tab === key ? "btn-gradient text-white" : "bg-soft text-faint"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === "account" && (
        <div className="bg-panel rounded-2xl shadow-card border border-line p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Private account</p>
              <p className="text-xs text-faint">Only approved followers can see your posts.</p>
            </div>
            <button
              onClick={togglePrivacy}
              className={`w-11 h-6 rounded-full transition relative ${privatAccount ? "bg-brand-pink" : "bg-soft"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-panel shadow transition-all ${
                  privatAccount ? "left-5.5" : "left-0.5"
                }`}
                style={{ left: privatAccount ? "22px" : "2px" }}
              />
            </button>
          </div>
        </div>
      )}

      {tab === "appearance" && (
        <div className="bg-panel rounded-2xl shadow-card border border-line p-5">
          <p className="text-sm font-semibold mb-1">Theme</p>
          <p className="text-xs text-faint mb-4">Choose how Gramline looks on this device.</p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "light", label: "Light", icon: Sun },
              { key: "dark", label: "Dark", icon: Moon },
              { key: "system", label: "System", icon: Monitor },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition ${
                  theme === key
                    ? "border-brand-pink bg-pink-50 dark:bg-brand-pink/10 text-brand-pink"
                    : "border-line hover:bg-soft text-faint"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "password" && (
        <form onSubmit={changePassword} className="bg-panel rounded-2xl shadow-card border border-line p-5 flex flex-col gap-3">
          <input
            type="password"
            placeholder="Current password"
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            className="bg-soft rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30"
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={passwords.next}
            onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
            className="bg-soft rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-pink/30"
            required
            minLength={6}
          />
          {msg && <p className="text-xs text-faint">{msg}</p>}
          <button className="btn-gradient text-white font-semibold text-sm rounded-xl py-2.5">
            Update password
          </button>
        </form>
      )}

      {tab === "danger" && (
        <div className="bg-panel rounded-2xl shadow-card border border-line p-5 flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold mb-1">Deactivate account</p>
            <p className="text-xs text-faint mb-3">
              Your profile and posts are hidden until you log in again.
            </p>
            {!confirmDeactivate ? (
              <button
                onClick={() => setConfirmDeactivate(true)}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-soft hover:bg-soft"
              >
                Deactivate account
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={deactivate} className="text-sm font-semibold px-4 py-2 rounded-lg bg-amber-500 text-white">
                  Confirm deactivate
                </button>
                <button onClick={() => setConfirmDeactivate(false)} className="text-sm px-4 py-2 rounded-lg bg-soft">
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-line pt-5">
            <p className="text-sm font-semibold mb-1 text-red-500 flex items-center gap-1.5">
              <Trash2 size={15} /> Delete account permanently
            </p>
            <p className="text-xs text-faint mb-3">
              This removes your account and all your posts. This can't be undone.
            </p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
              >
                Delete account
              </button>
            ) : (
              <div className="flex flex-col gap-2 max-w-xs">
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="bg-soft rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-300"
                />
                <div className="flex gap-2">
                  <button onClick={deleteAccount} className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-500 text-white">
                    Confirm delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-sm px-4 py-2 rounded-lg bg-soft">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
