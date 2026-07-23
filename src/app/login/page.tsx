"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "create">("login");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      redirect: true,
      callbackUrl: "/",
    });

    if (result?.error) {
      setError("Couldn't sign in. Try again.");
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">The Mirror</h1>
          <p className="text-sm text-[var(--muted)]">
            {mode === "login" ? "See your reflection." : "Create your reflection."}
          </p>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[var(--surface-light)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-medium hover:bg-[var(--border)]/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--muted)]">or</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmail} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-3 bg-[var(--surface-light)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full px-5 py-3 bg-[var(--accent)] text-[var(--background)] font-semibold rounded-lg hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading
              ? "Opening..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        {/* Toggle Login / Create */}
        <div className="text-center">
          {mode === "login" ? (
            <p className="text-sm text-[var(--muted)]">
              New here?{" "}
              <button
                onClick={() => { setMode("create"); setError(null); }}
                className="text-[var(--accent)] hover:underline"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Already have an account?{" "}
              <button
                onClick={() => { setMode("login"); setError(null); }}
                className="text-[var(--accent)] hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-[10px] text-[var(--muted)] text-center">
          No password required. Your entries are private.
        </p>
      </div>
    </main>
  );
}
