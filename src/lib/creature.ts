import { getSQL } from "@/lib/db";

export type CreatureTier = 
  | "animal_low"      // Pure animal (ΔI 0-200)
  | "animal_mid"      // Awakening animal (ΔI 200-800)
  | "hybrid"          // Hybrid form (ΔI 800-2000)
  | "spirit_emerging" // Spirit emerging (ΔI 2000-5000)
  | "spirit_full"     // Full spirit (ΔI 5000-15000)
  | "transcendent";   // Transcendent (ΔI 15000+)

export type CreatureArchetype = 
  | "prey"       // Fear-dominant low ΔI
  | "predator"   // Hunger-dominant low ΔI
  | "domestic"   // Love-dominant low ΔI
  | "guardian"   // Fear-dominant high ΔI
  | "warrior"    // Hunger-dominant high ΔI
  | "angel";     // Love-dominant high ΔI

export interface CreatureState {
  tier: CreatureTier;
  archetype: CreatureArchetype;
  deltaI: number;
  c: number;
  lfhDominant: "love" | "fear" | "hunger";
  cumulativeEi: number;
}

/**
 * Calculate creature tier from ΔI
 */
export function getCreatureTier(deltaI: number): CreatureTier {
  if (deltaI >= 15000) return "transcendent";
  if (deltaI >= 5000) return "spirit_full";
  if (deltaI >= 2000) return "spirit_emerging";
  if (deltaI >= 800) return "hybrid";
  if (deltaI >= 200) return "animal_mid";
  return "animal_low";
}

/**
 * Calculate creature archetype from LFH dominance + tier
 */
export function getCreatureArchetype(
  lfhDominant: "love" | "fear" | "hunger",
  tier: CreatureTier
): CreatureArchetype {
  const isHighTier = ["spirit_emerging", "spirit_full", "transcendent"].includes(tier);
  
  if (lfhDominant === "love") return isHighTier ? "angel" : "domestic";
  if (lfhDominant === "hunger") return isHighTier ? "warrior" : "predator";
  return isHighTier ? "guardian" : "prey"; // fear
}

/**
 * Get user's cumulative profile (creates if doesn't exist)
 */
export async function getUserProfile(userId: string) {
  const sql = getSQL();
  
  const rows = await sql`
    SELECT * FROM mirror_profiles WHERE user_id = ${userId}
  `;

  if (rows.length === 0) {
    await sql`
      INSERT INTO mirror_profiles (user_id) VALUES (${userId})
      ON CONFLICT (user_id) DO NOTHING
    `;
    return {
      userId,
      cumulativeEi: 0,
      allBridges: [] as string[],
      totalEntries: 0,
      currentCreatureTier: "animal_low" as CreatureTier,
      currentCreatureArchetype: "prey" as CreatureArchetype,
      currentLfhDominant: "fear" as const,
      currentC: 0.3,
      currentDeltaI: 0,
      switchPattern: null as string | null,
      switchFiredCount: 0,
      streakDays: 0,
      lastEntryDate: null as string | null,
    };
  }

  const row = rows[0];
  return {
    userId: row.user_id as string,
    cumulativeEi: row.cumulative_ei as number,
    allBridges: (row.all_bridges || []) as string[],
    totalEntries: row.total_entries as number,
    currentCreatureTier: row.current_creature_tier as CreatureTier,
    currentCreatureArchetype: row.current_creature_archetype as CreatureArchetype,
    currentLfhDominant: row.current_lfh_dominant as "love" | "fear" | "hunger",
    currentC: parseFloat(row.current_c as string),
    currentDeltaI: row.current_delta_i as number,
    switchPattern: row.switch_pattern as string | null,
    switchFiredCount: row.switch_fired_count as number,
    streakDays: row.streak_days as number,
    lastEntryDate: row.last_entry_date as string | null,
  };
}

/**
 * Update user profile after a new diary entry is processed
 */
export async function updateProfileAfterEntry(
  userId: string,
  newEi: number,
  newBridges: string[],
  c: number,
  lfhDominant: "love" | "fear" | "hunger",
  deltaI: number
) {
  const sql = getSQL();
  const tier = getCreatureTier(deltaI);
  const archetype = getCreatureArchetype(lfhDominant, tier);
  const today = new Date().toISOString().split("T")[0];

  // Get current profile for streak calculation
  const profile = await getUserProfile(userId);
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const newStreak = profile.lastEntryDate === yesterday || profile.lastEntryDate === today
    ? profile.streakDays + (profile.lastEntryDate === today ? 0 : 1)
    : 1;

  // Merge new bridges with existing (dedupe)
  const existingBridges = profile.allBridges;
  const mergedBridges = [...new Set([...existingBridges, ...newBridges])];

  await sql`
    UPDATE mirror_profiles SET
      cumulative_ei = cumulative_ei + ${newEi},
      all_bridges = ${JSON.stringify(mergedBridges)},
      total_entries = total_entries + 1,
      current_creature_tier = ${tier},
      current_creature_archetype = ${archetype},
      current_lfh_dominant = ${lfhDominant},
      current_c = ${c},
      current_delta_i = ${deltaI},
      streak_days = ${newStreak},
      last_entry_date = ${today},
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;

  return { tier, archetype, deltaI, cumulativeEi: profile.cumulativeEi + newEi, streak: newStreak };
}
