"use client";

import { useState, useEffect } from "react";
import TosGate from "@/components/TosGate";

export default function Home() {
  const [tosAccepted, setTosAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/tos")
      .then((r) => r.json())
      .then((data) => setTosAccepted(data.accepted ?? false))
      .catch(() => setTosAccepted(false));
  }, []);

  // Loading state
  if (tosAccepted === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Loading...</p>
      </main>
    );
  }

  // TOS gate — one time only
  if (!tosAccepted) {
    return <TosGate onAccept={() => setTosAccepted(true)} />;
  }

  // Main hub — blank for now
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">DailyMorph</h1>
        <p className="text-sm text-[var(--muted)]">Welcome back.</p>
      </div>
    </main>
  );
}
