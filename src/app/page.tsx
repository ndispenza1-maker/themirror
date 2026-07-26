"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import TosGate from "@/components/TosGate";

type Creature = "deer" | "snake" | "dog";
type GamePhase = "loading" | "tos" | "choose" | "fuel" | "ready" | "play";

interface ProfileData {
  creature: Creature;
  occupation: string;
  hobbies: string;
  consistentWork: string;
  consistentPersonal: string;
}

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [creature, setCreature] = useState<Creature | null>(null);
  const [fuelStep, setFuelStep] = useState(0);
  const [occupation, setOccupation] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [consistentWork, setConsistentWork] = useState("");
  const [consistentPersonal, setConsistentPersonal] = useState("");
  const [saving, setSaving] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [diaryText, setDiaryText] = useState("");
  const [deltaI, setDeltaI] = useState(0);

  // Boot: check TOS + profile state
  useEffect(() => {
    async function boot() {
      try {
        const tosRes = await fetch("/api/tos");
        const tosData = await tosRes.json();
        if (!tosData.accepted) {
          setPhase("tos");
          return;
        }

        const profileRes = await fetch("/api/profile");
        const profileData = await profileRes.json();
        if (profileData.completed && profileData.profile) {
          setCreature(profileData.profile.creature);
          setOccupation(profileData.profile.occupation || "");
          setHobbies(profileData.profile.hobbies || "");
          setConsistentWork(profileData.profile.consistent_work || "");
          setConsistentPersonal(profileData.profile.consistent_personal || "");
          setPhase("ready");
        } else {
          setPhase("choose");
        }
      } catch {
        setPhase("tos");
      }
    }
    boot();
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creature,
          occupation: occupation.trim(),
          hobbies: hobbies.trim(),
          consistentWork: consistentWork.trim(),
          consistentPersonal: consistentPersonal.trim(),
        }),
      });
      if (res.ok) {
        setPhase("ready");
      }
    } finally {
      setSaving(false);
    }
  }

  // TOS
  if (phase === "loading") {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-[#0a0a0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </main>
    );
  }

  if (phase === "tos") {
    return <TosGate onAccept={() => setPhase("choose")} />;
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0a0a0f]">
      {/* Background — always visible */}
      <img
        src="/assets/background-duality.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Creature on background — visible after selection */}
      {creature && phase !== "choose" && (
        <img
          src={`/assets/creature-${creature}.png`}
          alt={creature}
          className={`absolute bottom-[8%] left-1/2 z-10 w-auto -translate-x-1/2 object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-700 ${
            phase === "ready" || phase === "play" ? "h-[55%]" : "h-[40%] opacity-70"
          }`}
        />
      )}

      {/* HUD — top bar */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4">
        <div className="rounded-full border border-white/10 bg-black/50 px-4 py-1.5 backdrop-blur">
          <span className="text-[11px] font-medium tracking-wider text-white/70">DailyMorph</span>
        </div>
        {phase === "ready" && (
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-black/50 px-4 py-1.5 backdrop-blur">
              <span className="text-[11px] tracking-wider text-white/50">ΔI: </span>
              <span className="text-[11px] font-bold text-white">{deltaI}</span>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[11px] text-white/50 backdrop-blur hover:text-white/80 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* PHASE: Choose creature */}
      {phase === "choose" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white md:text-3xl">Which one are you?</h1>
            <p className="mt-2 text-sm text-white/50">Right now. Not who you want to be. Who you are.</p>
          </div>

          <div className="flex gap-6 md:gap-10">
            {(["deer", "snake", "dog"] as const).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCreature(c);
                  setPhase("fuel");
                  setFuelStep(0);
                }}
                className={`group flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all duration-300 hover:scale-105 ${
                  creature === c
                    ? "border-white/40 bg-white/10 scale-105"
                    : "border-white/10 bg-black/30 hover:border-white/25 hover:bg-white/5"
                }`}
              >
                <img
                  src={`/assets/creature-${c}.png`}
                  alt={c}
                  className="h-24 w-24 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] md:h-32 md:w-32"
                />
                <span className="text-xs font-medium uppercase tracking-widest text-white/60 group-hover:text-white/90">
                  {c === "deer" ? "The Deer" : c === "snake" ? "The Snake" : "The Dog"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PHASE: Fuel (EI gathering) */}
      {phase === "fuel" && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/70 p-6 backdrop-blur-lg">
            {fuelStep === 0 && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Loading EI — Step 1 of 3</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">What have you been training?</h2>
                  <p className="mt-1 text-sm text-white/40">Your creature inherits your experience.</p>
                </div>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="What you do for work..."
                  maxLength={120}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none transition-colors"
                  autoFocus
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setFuelStep(1)}
                    disabled={!occupation.trim()}
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors disabled:opacity-20"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {fuelStep === 1 && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Loading EI — Step 2 of 3</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">What else do you carry?</h2>
                  <p className="mt-1 text-sm text-white/40">Bonus XP. Everything outside of work that built you.</p>
                </div>
                <input
                  type="text"
                  value={hobbies}
                  onChange={(e) => setHobbies(e.target.value)}
                  placeholder="Hobbies, skills, interests..."
                  maxLength={200}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none transition-colors"
                  autoFocus
                />
                <div className="flex justify-between">
                  <button
                    onClick={() => setFuelStep(0)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setFuelStep(2)}
                    disabled={!hobbies.trim()}
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors disabled:opacity-20"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {fuelStep === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Loading EI — Step 3 of 3</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">What do you always return to?</h2>
                  <p className="mt-1 text-sm text-white/40">The pattern that&apos;s load-bearing. Work and personal.</p>
                </div>
                <input
                  type="text"
                  value={consistentWork}
                  onChange={(e) => setConsistentWork(e.target.value)}
                  placeholder="At work, you always come back to..."
                  maxLength={200}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none transition-colors"
                  autoFocus
                />
                <input
                  type="text"
                  value={consistentPersonal}
                  onChange={(e) => setConsistentPersonal(e.target.value)}
                  placeholder="Personally, you always come back to..."
                  maxLength={200}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none transition-colors"
                />
                <div className="flex justify-between">
                  <button
                    onClick={() => setFuelStep(1)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={!consistentWork.trim() || !consistentPersonal.trim() || saving}
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors disabled:opacity-20"
                  >
                    {saving ? "Building..." : "Spawn creature"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE: Ready — creature spawned, waiting for first entry */}
      {phase === "ready" && !diaryOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full border border-white/10 bg-black/50 px-5 py-2 backdrop-blur">
              <span className="text-xs text-white/50">
                {deltaI === 0 ? "ΔI: 0 — Write your first entry to begin" : `Tier: Animal • ΔI: ${deltaI}`}
              </span>
            </div>
            <button
              onClick={() => setDiaryOpen(true)}
              className="rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur hover:bg-white/15 hover:border-white/30 transition-all"
            >
              ✍️ Write Entry
            </button>
          </div>
        </div>
      )}

      {/* Diary input overlay */}
      {diaryOpen && (
        <div className="absolute inset-0 z-30 flex items-end justify-center p-4 md:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d12]/95 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Daily Entry</h2>
              <button
                onClick={() => setDiaryOpen(false)}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-white/40">
              What happened today? What are you thinking about? Write raw — the equation reads between the lines.
            </p>
            <textarea
              value={diaryText}
              onChange={(e) => setDiaryText(e.target.value)}
              placeholder="Start writing..."
              maxLength={5000}
              rows={6}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none transition-colors"
              autoFocus
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-white/30">{diaryText.length}/5000</span>
              <button
                disabled={diaryText.trim().length < 10}
                onClick={async () => {
                  const res = await fetch("/api/diary", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: diaryText.trim() }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setDeltaI(data.deltaI || 0);
                    setDiaryText("");
                    setDiaryOpen(false);
                  }
                }}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors disabled:opacity-20"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
