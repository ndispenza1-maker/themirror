"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">The Mirror</h1>
          <p className="text-sm text-[var(--muted)]">Enter to see your reflection.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
            {loading ? "Opening..." : "Enter"}
          </button>
        </form>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <p className="text-[10px] text-[var(--muted)] text-center">
          No password. Your email is your key. Your entries are private.
        </p>
      </div>
    </main>
  );
}
