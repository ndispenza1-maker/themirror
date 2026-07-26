"use client";

import { useState } from "react";

interface StartingProfileData {
  sex: "male" | "female" | null;
  relationshipStatus: "single" | "relationship" | null;
  age: string;
  occupation: string;
  hobbies: string;
  consistentWork: string;
  consistentPersonal: string;
}

interface StartingProfileProps {
  onComplete: (data: StartingProfileData) => void;
}

export default function StartingProfile({ onComplete }: StartingProfileProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<StartingProfileData>({
    sex: null,
    relationshipStatus: null,
    age: "",
    occupation: "",
    hobbies: "",
    consistentWork: "",
    consistentPersonal: "",
  });

  const totalSteps = 3;

  function canAdvance(): boolean {
    if (step === 1) return data.sex !== null && data.relationshipStatus !== null && data.age.trim().length > 0;
    if (step === 2) return data.occupation.trim().length > 0 && data.hobbies.trim().length > 0;
    if (step === 3) return data.consistentWork.trim().length > 0 && data.consistentPersonal.trim().length > 0;
    return false;
  }

  function handleNext() {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Starting Profile</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {step === 1 && "Who are you?"}
            {step === 2 && "What do you carry?"}
            {step === 3 && "What's most consistent?"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            {step === 1 && "Basic identity. This shapes your starting form."}
            {step === 2 && "Your background builds the foundation of your world."}
            {step === 3 && "What you return to most often is what's load-bearing."}
          </p>
        </div>
        <div className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
          Step {step} of {totalSteps}
        </div>
      </div>

      {/* Step 1 — Identity */}
      {step === 1 && (
        <div className="grid gap-3 md:grid-cols-3">
          {/* Sex */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Sex</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setData({ ...data, sex: "male" })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  data.sex === "male"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/40"
                }`}
              >
                Male
              </button>
              <button
                onClick={() => setData({ ...data, sex: "female" })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  data.sex === "female"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/40"
                }`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Relationship Status */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Relationship</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setData({ ...data, relationshipStatus: "single" })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  data.relationshipStatus === "single"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/40"
                }`}
              >
                Single
              </button>
              <button
                onClick={() => setData({ ...data, relationshipStatus: "relationship" })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  data.relationshipStatus === "relationship"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/40"
                }`}
              >
                Relationship
              </button>
            </div>
          </div>

          {/* Age */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Age</p>
            <input
              type="number"
              min="18"
              max="120"
              value={data.age}
              onChange={(e) => setData({ ...data, age: e.target.value })}
              placeholder="25"
              className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:border-[var(--accent)]/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Step 2 — Background */}
      {step === 2 && (
        <div className="grid gap-3 md:grid-cols-2">
          {/* Occupation */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Occupation</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]/70">What do you do for work?</p>
            <input
              type="text"
              value={data.occupation}
              onChange={(e) => setData({ ...data, occupation: e.target.value })}
              placeholder="HVAC technician, nurse, developer..."
              maxLength={120}
              className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:border-[var(--accent)]/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Hobbies */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Hobbies & Interests</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]/70">What do you do outside of work?</p>
            <input
              type="text"
              value={data.hobbies}
              onChange={(e) => setData({ ...data, hobbies: e.target.value })}
              placeholder="Reading, lifting, cooking, gaming..."
              maxLength={200}
              className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:border-[var(--accent)]/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Step 3 — Consistency */}
      {step === 3 && (
        <div className="grid gap-3 md:grid-cols-2">
          {/* Most consistent work */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Most consistent at work</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]/70">What part of your work do you always come back to?</p>
            <input
              type="text"
              value={data.consistentWork}
              onChange={(e) => setData({ ...data, consistentWork: e.target.value })}
              placeholder="Troubleshooting, building systems, leading..."
              maxLength={200}
              className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:border-[var(--accent)]/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Most consistent personal */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Most consistent personally</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]/70">What do you return to most in your personal life?</p>
            <input
              type="text"
              value={data.consistentPersonal}
              onChange={(e) => setData({ ...data, consistentPersonal: e.target.value })}
              placeholder="Writing, fitness, family time, music..."
              maxLength={200}
              className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:border-[var(--accent)]/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-auto flex items-center justify-between pt-2">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={handleNext}
          disabled={!canAdvance()}
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {step === totalSteps ? "Build my starting form" : "Next"}
        </button>
      </div>
    </div>
  );
}
