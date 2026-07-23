"use client";

import { type CreatureTier, type CreatureArchetype } from "@/lib/creature";

interface CreatureDisplayProps {
  tier: CreatureTier;
  archetype: CreatureArchetype;
  deltaI: number;
  c: number;
  lfhDominant: "love" | "fear" | "hunger";
  animate?: boolean;
}

const TIER_VISUALS: Record<CreatureTier, { size: string; opacity: string; glow: string }> = {
  animal_low: { size: "w-24 h-24", opacity: "opacity-50", glow: "" },
  animal_mid: { size: "w-28 h-28", opacity: "opacity-65", glow: "shadow-sm" },
  hybrid: { size: "w-32 h-32", opacity: "opacity-80", glow: "shadow-md" },
  spirit_emerging: { size: "w-36 h-36", opacity: "opacity-90", glow: "shadow-lg" },
  spirit_full: { size: "w-40 h-40", opacity: "opacity-100", glow: "shadow-xl" },
  transcendent: { size: "w-44 h-44", opacity: "opacity-100", glow: "shadow-2xl" },
};

const ARCHETYPE_CONFIG: Record<CreatureArchetype, { emoji: string; label: string; color: string; bgGlow: string }> = {
  prey: { emoji: "🐇", label: "Prey", color: "text-red-300", bgGlow: "shadow-red-500/20" },
  predator: { emoji: "🐺", label: "Predator", color: "text-yellow-300", bgGlow: "shadow-yellow-500/20" },
  domestic: { emoji: "🐕", label: "Domestic", color: "text-green-300", bgGlow: "shadow-green-500/20" },
  guardian: { emoji: "🛡️", label: "Guardian", color: "text-blue-300", bgGlow: "shadow-blue-500/20" },
  warrior: { emoji: "⚔️", label: "Warrior", color: "text-orange-300", bgGlow: "shadow-orange-500/20" },
  angel: { emoji: "✨", label: "Angel", color: "text-purple-300", bgGlow: "shadow-purple-500/20" },
};

const TIER_LABELS: Record<CreatureTier, string> = {
  animal_low: "Instinct",
  animal_mid: "Awakening",
  hybrid: "Emerging",
  spirit_emerging: "Rising",
  spirit_full: "Spirit",
  transcendent: "Beyond",
};

export default function CreatureDisplay({ tier, archetype, deltaI, c, lfhDominant, animate = true }: CreatureDisplayProps) {
  const tierVisual = TIER_VISUALS[tier];
  const archetypeConfig = ARCHETYPE_CONFIG[archetype];
  const tierLabel = TIER_LABELS[tier];

  const isHighTier = ["spirit_emerging", "spirit_full", "transcendent"].includes(tier);
  const pulseClass = animate && isHighTier ? "animate-pulse" : "";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Creature visual */}
      <div className={`relative flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] ${tierVisual.size} ${tierVisual.glow} ${archetypeConfig.bgGlow} transition-all duration-1000 ${pulseClass}`}>
        <span className={`text-5xl ${tierVisual.opacity} transition-all duration-1000`}>
          {archetypeConfig.emoji}
        </span>

        {/* Glow ring for high tiers */}
        {isHighTier && (
          <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/30 animate-ping" style={{ animationDuration: "3s" }} />
        )}
      </div>

      {/* Labels */}
      <div className="text-center space-y-1">
        <p className={`text-sm font-semibold ${archetypeConfig.color} transition-colors duration-700`}>
          {archetypeConfig.label}
        </p>
        <p className="text-xs text-[var(--muted)] font-mono">
          {tierLabel} • ΔI {deltaI.toLocaleString()}
        </p>
      </div>

      {/* State bar */}
      <div className="w-full max-w-[160px]">
        <div className="flex justify-between text-[10px] text-[var(--muted)] mb-1">
          <span>C: {c.toFixed(2)}</span>
          <span className="capitalize">{lfhDominant}-led</span>
        </div>
        <div className="h-1.5 bg-[var(--surface-light)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${c * 100}%`,
              backgroundColor: lfhDominant === "love" ? "var(--love)" : lfhDominant === "fear" ? "var(--fear)" : "var(--hunger)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
