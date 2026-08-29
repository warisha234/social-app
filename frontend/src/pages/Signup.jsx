import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShowcase from "../components/AuthShowcase";
import FieldInput from "../components/FieldInput";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-ivory">
      <AuthShowcase
        eyebrow="Request an invitation"
        title={
          <>
            Build a feed
            <br />
            <span className="italic text-white/70">worth</span>
            <br />
            being followed.
          </>
        }
        line1="Join a circle of people who post with intention —"
        line2="not just to fill a feed."
      />

      <div className="flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-[380px]">
          <div className="md:hidden flex items-center gap-2 mb-8">
            <span className="text-gold text-lg leading-none">✦</span>
            <span className="font-serif italic text-xl text-ink">Gramline</span>
          </div>

          <p className="uppercase tracking-[0.22em] text-[11px] text-rose font-semibold mb-3">
            Get started
          </p>
          <h2 className="font-serif text-3xl text-ink mb-2">Create your account</h2>
          <p className="text-neutral-400 text-sm mb-8 font-body">
            Takes less than a minute — no card, no fuss.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <FieldInput
              label="Full name"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Warisha Turab"
              required
            />
            <FieldInput
              label="Username"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              placeholder="warisha.creates"
              required
            />
            <FieldInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              required
            />
            <FieldInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />

            {error && (
              <p className="text-xs text-rose -mt-2 font-body">{error}</p>
            )}

            <button
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-full bg-ink text-ivory font-body font-semibold text-sm py-3.5 mt-2 transition disabled:opacity-60"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-rose to-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">{loading ? "Creating account..." : "Sign up"}</span>
            </button>
          </form>

          <p className="text-sm text-neutral-400 mt-8 text-center font-body">
            Already have an account?{" "}
            <Link to="/login" className="text-ink font-semibold hover:text-rose transition">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
