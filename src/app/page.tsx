"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import TosGate from "@/components/TosGate";
import StartingProfile from "@/components/StartingProfile";

interface StartingProfileData {
  sex: "male" | "female" | null;
  creature: "deer" | "snake" | "dog" | null;
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
            creature: data.profile.creature,
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



  async function handleProfileComplete(data: StartingProfileData) {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) return;

    setProfilePreview(data);
    setProfileCompleted(true);


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


  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col gap-4 md:min-h-[calc(100vh-3rem)]">
        <section className="relative flex-[7] overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(180deg,#13131a_0%,#0d0d12_45%,#09090c_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_rgba(0,0,0,0.35)]">
          {/* Background image - static duality scene */}
          <img
            src="/assets/background-duality.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

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

          {/* Character creature on the background */}
          <div className="absolute inset-0">
            <div className="relative h-full w-full overflow-hidden">
              {profilePreview?.creature && (
                <img
                  src={`/assets/creature-${profilePreview.creature}.png`}
                  alt={profilePreview.creature}
                  className="absolute bottom-[5%] left-1/2 z-20 h-[65%] w-auto -translate-x-1/2 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                />
              )}
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
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Creature</p>
                      <div className="mt-2 flex items-center gap-2">
                        {profilePreview?.creature && (
                          <img
                            src={`/assets/creature-${profilePreview.creature}.png`}
                            alt={profilePreview.creature}
                            className="h-8 w-8 object-contain"
                          />
                        )}
                        <p className="text-sm text-[var(--foreground)] capitalize">
                          {profilePreview?.creature === "deer" ? "Deer (Fear)" : profilePreview?.creature === "snake" ? "Snake (Hunger)" : profilePreview?.creature === "dog" ? "Dog (Love)" : ""}
                        </p>
                      </div>
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

      {/* Logout button */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="absolute top-4 right-4 z-50 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/40 transition-colors"
      >
        Log out
      </button>
    </main>
  );
}
