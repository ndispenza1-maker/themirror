"use client";

import { useState } from "react";
import DiaryInput from "@/components/DiaryInput";
import CreatureDisplay from "@/components/CreatureDisplay";
import type { CreatureTier, CreatureArchetype } from "@/lib/creature";

interface MirrorResult {
  c: number;
  lfhDominant: "love" | "fear" | "hunger";
  ei: number;
  cumulativeEi: number;
  ntrDensity: number;
  deltaI: number;
  bridges: string[];
  read: string;
  creature: {
    tier: CreatureTier;
    archetype: CreatureArchetype;
  };
  streak: number;
}

export default function Home() {
  const [result, setResult] = useState<MirrorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(content: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">The Mirror</h1>
          <p className="text-sm text-[var(--muted)]">
            {!result
              ? "Write what's on your mind. The mirror shows you what's underneath."
              : "Your reflection, right now."}
          </p>
        </div>

        {/* Creature (always visible once calculated) */}
        {result && (
          <div className="flex justify-center py-4">
            <CreatureDisplay
              tier={result.creature.tier}
              archetype={result.creature.archetype}
              deltaI={result.deltaI}
              c={result.c}
              lfhDominant={result.lfhDominant}
            />
          </div>
        )}

        {/* Input or Result */}
        {!result ? (
          <DiaryInput onSubmit={handleSubmit} loading={loading} />
        ) : (
          <div className="space-y-6">
            {/* The Read */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
              <p className="text-xs font-mono text-[var(--accent)]/70 mb-3">THE READ</p>
              <div className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                {result.read}
              </div>
            </div>

            {/* Bridges Found */}
            {result.bridges.length > 0 && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
                <p className="text-xs font-mono text-[var(--accent)]/70 mb-2">BRIDGES FOUND</p>
                <ul className="space-y-1">
                  {result.bridges.map((bridge, i) => (
                    <li key={i} className="text-xs text-[var(--muted)] flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-0.5">→</span>
                      {bridge}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* The Math */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
              <p className="text-xs font-mono text-[var(--muted)] mb-2">THE EQUATION</p>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--muted)]">
                  (
                  <span className={result.lfhDominant === "love" ? "text-[var(--love)]" : result.lfhDominant === "fear" ? "text-[var(--fear)]" : "text-[var(--hunger)]"}>
                    C={result.c.toFixed(2)}
                  </span>
                  {" × "}
                  <span className="text-[var(--foreground)]">EI={result.cumulativeEi.toLocaleString()}</span>
                  )<sup className="text-[var(--accent)]">{result.ntrDensity.toFixed(1)}</sup>
                </span>
                <span className="text-[var(--accent)] font-bold">
                  ΔI = {result.deltaI.toLocaleString()}
                </span>
              </div>
              {result.streak > 1 && (
                <p className="text-[10px] text-[var(--muted)] mt-2">
                  🔥 {result.streak} day streak
                </p>
              )}
            </div>

            {/* Did you act? (Switch detection seed) */}
            <div className="bg-[var(--surface-light)] border border-[var(--border)] rounded-lg p-4 text-center">
              <p className="text-xs text-[var(--muted)] mb-2">After your last entry — did you act?</p>
              <div className="flex gap-3 justify-center">
                <button className="px-4 py-1.5 text-xs border border-[var(--border)] text-[var(--muted)] rounded-md hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors">
                  Yes, I moved
                </button>
                <button className="px-4 py-1.5 text-xs border border-[var(--border)] text-[var(--muted)] rounded-md hover:border-[var(--border)] transition-colors">
                  Still processing
                </button>
              </div>
            </div>

            {/* Write again */}
            <button
              onClick={handleReset}
              className="w-full py-3 border border-[var(--border)] text-[var(--muted)] rounded-lg hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] transition-colors text-sm"
            >
              Write another entry
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
