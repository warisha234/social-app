import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShowcase from "../components/AuthShowcase";
import FieldInput from "../components/FieldInput";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-ivory">
      <AuthShowcase
        eyebrow="Members' entrance"
        title={
          <>
            Your feed,
            <br />
            <span className="italic text-white/70">held to a</span>
            <br />
            higher standard.
          </>
        }
        line1="A quieter, more considered place to share —"
        line2="stories, posts, and people worth following."
      />

      <div className="flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-[380px]">
          <div className="md:hidden flex items-center gap-2 mb-10">
            <span className="text-gold text-lg leading-none">✦</span>
            <span className="font-serif italic text-xl text-ink">Gramline</span>
          </div>

          <p className="uppercase tracking-[0.22em] text-[11px] text-rose font-semibold mb-3">
            Welcome back
          </p>
          <h2 className="font-serif text-3xl text-ink mb-2">Log in to continue</h2>
          <p className="text-neutral-400 text-sm mb-10 font-body">
            Pick up right where your circle left off.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            <FieldInput
              label="Username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="warisha.creates"
              required
            />
            <FieldInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <p className="text-xs text-rose -mt-3 font-body">{error}</p>
            )}

            <button
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-full bg-ink text-ivory font-body font-semibold text-sm py-3.5 mt-2 transition disabled:opacity-60"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-rose to-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">{loading ? "Logging in..." : "Log in"}</span>
            </button>
          </form>

          <div className="flex items-center gap-3 my-8">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-300 font-body">
              New here
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <Link
            to="/signup"
            className="block text-center border border-neutral-200 rounded-full py-3.5 text-sm font-semibold text-ink hover:border-ink transition font-body"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
