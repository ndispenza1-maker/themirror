"use client";

import { useState } from "react";

interface TosGateProps {
  onAccept: () => void;
}

export default function TosGate({ onAccept }: TosGateProps) {
  const [loading, setLoading] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    if (atBottom) setScrolledToBottom(true);
  }

  async function handleAccept() {
    setLoading(true);
    try {
      const res = await fetch("/api/tos", { method: "POST" });
      if (res.ok) {
        onAccept();
      }
    } catch {
      // silent retry on next click
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">DailyMorph</h1>
          <p className="text-sm text-[var(--muted)]">Before we begin, please review and accept the terms.</p>
        </div>

        <div
          onScroll={handleScroll}
          className="h-80 overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 text-sm text-[var(--muted)] leading-relaxed space-y-4"
        >
          <h2 className="text-[var(--foreground)] font-semibold text-base">Terms of Service</h2>
          <p className="text-xs text-[var(--muted)]">Last updated: July 26, 2026</p>

          <h3 className="text-[var(--foreground)] font-medium mt-4">1. What DailyMorph Is</h3>
          <p>
            DailyMorph is a personal reflection tool. You write, the system reads your state using a proprietary equation engine, and shows you a visual representation of that state. It is not therapy, medical advice, or a substitute for professional help.
          </p>

          <h3 className="text-[var(--foreground)] font-medium mt-4">2. Your Data</h3>
          <p>
            Your diary entries are private and stored securely. They are used solely to calculate your equation values and generate your reflection. We do not sell, share, or distribute your writing to third parties.
          </p>
          <p>
            Your entries may be processed by AI language models to generate reads and equation values. This processing happens in real-time and is not stored by the AI provider.
          </p>

          <h3 className="text-[var(--foreground)] font-medium mt-4">3. Your Content</h3>
          <p>
            You own what you write. By using DailyMorph, you grant us a limited license to process your entries through our equation engine for the sole purpose of delivering the service to you.
          </p>

          <h3 className="text-[var(--foreground)] font-medium mt-4">4. No Guarantees</h3>
          <p>
            DailyMorph is provided as-is. We make no guarantees about accuracy, availability, or outcomes. The equation engine is experimental. The reads are reflections, not prescriptions.
          </p>

          <h3 className="text-[var(--foreground)] font-medium mt-4">5. Age Requirement</h3>
          <p>
            You must be at least 18 years old to use DailyMorph.
          </p>

          <h3 className="text-[var(--foreground)] font-medium mt-4">6. Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate accounts that abuse the service. You may delete your account and data at any time by contacting us.
          </p>

          <h3 className="text-[var(--foreground)] font-medium mt-4">7. Changes</h3>
          <p>
            We may update these terms. Continued use after changes constitutes acceptance.
          </p>

          <h3 className="text-[var(--foreground)] font-medium mt-4">8. Liability</h3>
          <p>
            DailyMorph and its creators are not liable for any decisions you make based on the output of this tool. You are responsible for your own actions. The mirror shows — you decide.
          </p>

          <div className="pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted)]">
              By clicking "I Agree" below, you acknowledge that you have read, understood, and agree to these terms.
            </p>
          </div>
        </div>

        <button
          onClick={handleAccept}
          disabled={loading || !scrolledToBottom}
          className="w-full px-5 py-3 bg-[var(--accent)] text-[var(--background)] font-semibold rounded-lg hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? "..." : scrolledToBottom ? "I Agree" : "Scroll to read all terms"}
        </button>
      </div>
    </main>
  );
}
