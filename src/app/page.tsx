"use client";

import { useEffect, useState } from "react";
import TosGate from "@/components/TosGate";
import StartingProfile from "@/components/StartingProfile";

interface StartingProfileData {
  sex: "male" | "female" | null;
  relationshipStatus: "single" | "relationship" | null;
  age: string;
  occupation: string;
  hobbies: string;
  consistentWork: string;
  consistentPersonal: string;
}

export default function Home() {
  const [tosAccepted, setTosAccepted] = useState<boolean | null>(null);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [profilePreview, setProfilePreview] = useState<StartingProfileData | null>(null);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [characterLoading, setCharacterLoading] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [extraInfoExpanded, setExtraInfoExpanded] = useState(false);
  const [extraInfo, setExtraInfo] = useState("");
  const [extraInfoSaved, setExtraInfoSaved] = useState(false);
  const [extraInfoSaving, setExtraInfoSaving] = useState(false);

  useEffect(() => {
    fetch("/api/tos")
      .then((r) => r.json())
      .then((data) => setTosAccepted(data.accepted ?? false))
      .catch(() => setTosAccepted(false));
  }, []);

  useEffect(() => {
    if (!tosAccepted) return;

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfileCompleted(data.completed ?? false);
        if (data.profile) {
          setProfilePreview({
            sex: data.profile.sex,
            relationshipStatus: data.profile.relationship_status,
            age: String(data.profile.age),
            occupation: data.profile.occupation,
            hobbies: data.profile.hobbies,
            consistentWork: data.profile.consistent_work,
            consistentPersonal: data.profile.consistent_personal,
          });
        }
      })
      .catch(() => setProfileCompleted(false));
  }, [tosAccepted]);

  useEffect(() => {
    if (!profileCompleted) return;

    fetch("/api/character/generate")
      .then((r) => r.json())
      .then((data) => {
        if (data.image) setCharacterImage(data.image);
      })
      .catch(() => {});
  }, [profileCompleted]);

  async function generateCharacter() {
    setCharacterLoading(true);
    try {
      const res = await fetch("/api/character/generate", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.image) {
        setCharacterImage(data.image);
      }
    } finally {
      setCharacterLoading(false);
    }
  }

  async function handleProfileComplete(data: StartingProfileData) {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) return;

    setProfilePreview(data);
    setProfileCompleted(true);

    setCharacterLoading(true);
    try {
      const imageRes = await fetch("/api/character/generate", { method: "POST" });
      const imageData = await imageRes.json();
      if (imageRes.ok && imageData.image) {
        setCharacterImage(imageData.image);
      }
    } finally {
      setCharacterLoading(false);
    }
  }

  if (tosAccepted === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted)]">Loading...</p>
      </main>
    );
  }

  if (!tosAccepted) {
    return <TosGate onAccept={() => setTosAccepted(true)} />;
  }

  if (profileCompleted === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted)]">Preparing your starting profile...</p>
      </main>
    );
  }

  const currentConsistency = profilePreview?.consistentPersonal ?? "Waiting for initial inputs";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col gap-4 md:min-h-[calc(100vh-3rem)]">
        <section className="relative flex-[7] overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(180deg,#13131a_0%,#0d0d12_45%,#09090c_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[48%] bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.18),transparent_55%)]" />
            <div className="absolute left-[8%] top-[14%] h-24 w-24 rounded-full bg-[rgba(255,244,190,0.08)] blur-2xl" />
            <div className="absolute right-[12%] top-[18%] h-32 w-32 rounded-full bg-[rgba(167,139,250,0.10)] blur-3xl" />
          </div>

          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 md:p-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">DailyMorph</p>
              <h1 className="mt-1 text-lg font-semibold text-[var(--foreground)] md:text-xl">
                {profileCompleted ? "Starting Profile" : "Character Build"}
              </h1>
            </div>
            <div className="rounded-full border border-[var(--border)] bg-[rgba(17,17,20,0.75)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] backdrop-blur">
              Live Preview
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute bottom-[28%] left-0 right-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(167,139,250,0.06))]" />
              <div className="absolute bottom-[18%] left-[-10%] h-36 w-[45%] rounded-[50%] bg-[rgba(88,88,112,0.28)] blur-[1px]" />
              <div className="absolute bottom-[16%] left-[22%] h-40 w-[38%] rounded-[50%] bg-[rgba(76,76,98,0.32)] blur-[1px]" />
              <div className="absolute bottom-[17%] right-[-6%] h-44 w-[42%] rounded-[50%] bg-[rgba(64,64,84,0.32)] blur-[1px]" />
              <div className="absolute bottom-[10%] left-0 right-0 h-24 bg-[rgba(20,20,28,0.62)]" />
              <div className="absolute bottom-[12%] left-[8%] h-20 w-6 rounded-t-full bg-[rgba(31,31,40,0.85)]" />
              <div className="absolute bottom-[12%] left-[12%] h-14 w-14 rounded-full bg-[rgba(31,31,40,0.85)]" />
              <div className="absolute bottom-[11%] right-[16%] h-20 w-7 rounded-t-full bg-[rgba(31,31,40,0.85)]" />
              <div className="absolute bottom-[11%] right-[11%] h-16 w-16 rounded-full bg-[rgba(31,31,40,0.85)]" />

              <div className="absolute bottom-[13%] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3">
                <div className="relative flex h-[280px] w-[210px] items-center justify-center overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.10)] bg-[rgba(17,17,20,0.55)] shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur md:h-[340px] md:w-[250px]">
                  {characterImage ? (
                    <img
                      src={characterImage}
                      alt="Starter character"
                      className="h-full w-full object-cover"
                    />
                  ) : characterLoading ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                      <p className="text-sm text-[var(--muted)]">Generating starter form...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center px-6">
                      <div className="h-20 w-20 rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(232,232,237,0.08)]" />
                      <p className="text-sm text-[var(--muted)]">Your character will appear here.</p>
                      {profileCompleted && (
                        <button
                          onClick={generateCharacter}
                          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--background)] hover:bg-[var(--accent-dim)] transition-colors"
                        >
                          Generate starter form
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="rounded-full border border-[var(--border)] bg-[rgba(17,17,20,0.78)] px-3 py-1 text-[11px] text-[var(--muted)] backdrop-blur">
                  {characterImage ? "Starter form generated" : profileCompleted ? "Starter form ready to generate" : "Starter form preview"}
                </div>
              </div>
            </div>

            <div className="relative h-[18%] min-h-[92px] border-t border-[rgba(255,255,255,0.04)] bg-[linear-gradient(180deg,#15151b_0%,#0c0c10_100%)]">
              <div className="absolute inset-x-0 top-3 flex items-center justify-center gap-3 px-4 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] md:justify-between md:px-6">
                <span>World Display</span>
                <span className="hidden md:inline">Character • Environment • Motion</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 md:left-6 md:right-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[rgba(17,17,20,0.74)] px-4 py-3 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">State</p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {characterImage ? "Starting profile recorded" : profileCompleted ? "Profile saved — generating form" : "Awaiting initial inputs"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[rgba(17,17,20,0.74)] px-4 py-3 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Environment</p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {profileCompleted ? currentConsistency : "Not formed yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-[3] rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)] md:px-6 md:py-5">
          {!profileCompleted ? (
            <StartingProfile onComplete={handleProfileComplete} />
          ) : (
            <div className="flex h-full flex-col gap-4">
              <button
                onClick={() => setProfileExpanded(!profileExpanded)}
                className="flex items-center justify-between w-full"
              >
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Starting Profile</p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">Foundation set</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Ready for next layer
                  </div>
                  <svg
                    className={`w-5 h-5 text-[var(--muted)] transition-transform duration-200 ${profileExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {profileExpanded && (
                <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/40 p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Sex</p>
                      <p className="mt-2 text-sm text-[var(--foreground)] capitalize">{profilePreview?.sex}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/40 p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Relationship</p>
                      <p className="mt-2 text-sm text-[var(--foreground)] capitalize">{profilePreview?.relationshipStatus}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/40 p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Age</p>
                      <p className="mt-2 text-sm text-[var(--foreground)]">{profilePreview?.age}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/40 p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Occupation</p>
                      <p className="mt-2 text-sm text-[var(--foreground)]">{profilePreview?.occupation}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/40 p-4 md:col-span-1">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Hobbies</p>
                      <p className="mt-2 text-sm text-[var(--foreground)]">{profilePreview?.hobbies}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/40 p-4 md:col-span-1">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Most consistent at work</p>
                      <p className="mt-2 text-sm text-[var(--foreground)]">{profilePreview?.consistentWork}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/40 p-4 md:col-span-1">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Most consistent personally</p>
                      <p className="mt-2 text-sm text-[var(--foreground)]">{profilePreview?.consistentPersonal}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Extra Info dropdown */}
              <button
                onClick={() => setExtraInfoExpanded(!extraInfoExpanded)}
                className="flex items-center justify-between w-full mt-2"
              >
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Extra Info</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {extraInfoSaved ? "Additional context saved" : "Add more context for the equation"}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-[var(--muted)] transition-transform duration-200 ${extraInfoExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {extraInfoExpanded && (
                <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]/50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] mb-2">Anything else that shapes how you process the world?</p>
                    <p className="text-[11px] text-[var(--muted)]/70 mb-3">Past experience, skills, challenges, things you keep coming back to. This feeds into how the equation reads your existing information.</p>
                    <textarea
                      value={extraInfo}
                      onChange={(e) => {
                        setExtraInfo(e.target.value);
                        setExtraInfoSaved(false);
                      }}
                      placeholder="Anything that helps paint the full picture..."
                      maxLength={2000}
                      rows={4}
                      className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:border-[var(--accent)]/50 focus:outline-none transition-colors resize-none"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[10px] text-[var(--muted)]">{extraInfo.length}/2000</p>
                      <button
                        onClick={async () => {
                          if (!extraInfo.trim()) return;
                          setExtraInfoSaving(true);
                          try {
                            const res = await fetch("/api/profile/extra", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ extraInfo: extraInfo.trim() }),
                            });
                            if (res.ok) setExtraInfoSaved(true);
                          } finally {
                            setExtraInfoSaving(false);
                          }
                        }}
                        disabled={extraInfoSaving || !extraInfo.trim()}
                        className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--background)] hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {extraInfoSaving ? "Saving..." : extraInfoSaved ? "Saved ✓" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
