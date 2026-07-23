import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSQL } from "@/lib/db";
import { getUserProfile, updateProfileAfterEntry } from "@/lib/creature";

const MIRROR_SYSTEM_PROMPT = `You are The Mirror — an equation engine that reads a person's state from their writing and calculates their accessible potential.

## The Equation: ΔI = (C × EI)^NTR

You receive:
1. A diary entry (raw stream of consciousness)
2. The user's accumulated bridge history (what connections have been found before)

You calculate:
- C (Coherence, 0.00-1.00) — read from the LANGUAGE itself
- EI (Existing Information bridges found in THIS entry) — new connections between what they know and what they're facing
- NTR density (1.0-3.0) — complexity/richness of what they're processing
- ΔI — their accessible potential right now

## Reading C from Language

HIGH C (0.70-1.00, Love-dominant):
- Clear, specific, non-reactive language
- Holds multiple perspectives
- Names uncertainty without panic
- Curiosity present

LOW C (0.15-0.35, Fear-dominant):
- Defensive: "I have to" / "they're making me" / "I have no choice"
- Black-and-white, absolute language
- Catastrophizing, blame externalization
- Vague, avoidant

MEDIUM C (0.40-0.60, Hunger-dominant):
- Short, clipped, urgent
- Already has the answer, seeking permission
- Action-oriented past the point of seeing
- Impatient with complexity

## Discovering EI (New Bridges)

Find connections between what the person KNOWS (from their language, references, metaphors, domain knowledge showing through) and what they're PROCESSING. Each bridge is a transferable pattern.

EI for this entry (new bridges found):
- 0-100: No new connections surfaced
- 100-500: 1-2 bridges found
- 500-2000: Multiple meaningful bridges
- 2000-5000: Deep structural parallels revealed

## NTR Density (Exponent)

How rich/complex is what they're processing?
- 1.0-1.3: Simple, single-domain situation
- 1.3-1.8: Multi-faceted, several moving parts
- 1.8-2.5: Complex, multi-domain, high stakes
- 2.5-3.0: Life-altering, everything-touches-everything

## Output

Return ONLY a JSON object:

{
  "c": <number 0-1>,
  "lfhDominant": "love" | "fear" | "hunger",
  "ei": <number — new bridges value for this entry>,
  "ntrDensity": <number 1.0-3.0>,
  "deltaI": <number — round((c * (cumulativeEi + ei)) ^ ntrDensity)>,
  "bridges": ["<bridge 1 — short description>", "<bridge 2>"],
  "read": "<2-3 paragraphs: what their language reveals about their state, bridges found, one honest closing line>"
}

## Voice
- Plain. Direct. Mirror, not therapist.
- Point to specific language that reveals state.
- Name bridges from THEIR world.
- Non-judgmental — animal state isn't bad, it's just visible.
- End with one clear line: what the mirror shows.

## Rules
- ALWAYS find at least 1 bridge (even a small one)
- The read must reference their ACTUAL words
- Never prescribe action. The mirror shows, the user decides.
- Return ONLY JSON. No markdown. No wrapping.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Engine not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json({ error: "Write at least a few words." }, { status: 400 });
    }

    // Sanitize input length (max 5000 chars)
    const sanitizedContent = content.trim().slice(0, 5000);

    // Get user's accumulated profile
    const profile = await getUserProfile(userId);

    const userMessage = [
      "**Diary Entry:**",
      sanitizedContent,
      "",
      `**Cumulative EI so far:** ${profile.cumulativeEi}`,
      `**Total entries:** ${profile.totalEntries}`,
      `**Previously found bridges:** ${profile.allBridges.slice(-10).join(", ") || "None yet — this is their first time."}`,
      "",
      "Read their C. Find new bridges. Calculate ΔI using cumulative EI + new EI. Return JSON only.",
    ].join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: MIRROR_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status);
      return NextResponse.json({ error: "Mirror unavailable" }, { status: 502 });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";

    let parsed: {
      c: number;
      lfhDominant: string;
      ei: number;
      ntrDensity: number;
      deltaI: number;
      bridges: string[];
      read: string;
    };

    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        c: 0.5,
        lfhDominant: "hunger",
        ei: 200,
        ntrDensity: 1.5,
        deltaI: 500,
        bridges: [],
        read: rawText,
      };
    }

    // Validate and clamp
    const c = Math.max(0, Math.min(1, parsed.c || 0.5));
    const lfhDominant = (["love", "fear", "hunger"].includes(parsed.lfhDominant)
      ? parsed.lfhDominant
      : "hunger") as "love" | "fear" | "hunger";
    const ei = Math.max(0, parsed.ei || 200);
    const ntrDensity = Math.max(1.0, Math.min(3.0, parsed.ntrDensity || 1.5));
    const totalEi = profile.cumulativeEi + ei;
    const deltaI = Math.round(Math.pow(c * totalEi, ntrDensity));
    const bridges = Array.isArray(parsed.bridges) ? parsed.bridges.slice(0, 5) : [];

    // Save diary entry
    const sql = getSQL();
    await sql`
      INSERT INTO diary_entries (user_id, content, c, lfh_dominant, ei, ntr_density, delta_i, bridges_found, creature_tier, creature_archetype, read)
      VALUES (${userId}, ${sanitizedContent}, ${c}, ${lfhDominant}, ${ei}, ${ntrDensity}, ${deltaI}, ${JSON.stringify(bridges)}, '', '', ${parsed.read || ""})
    `;

    // Update profile
    const creatureUpdate = await updateProfileAfterEntry(userId, ei, bridges, c, lfhDominant, deltaI);

    return NextResponse.json({
      c,
      lfhDominant,
      ei,
      cumulativeEi: totalEi,
      ntrDensity,
      deltaI,
      bridges,
      read: parsed.read || "",
      creature: {
        tier: creatureUpdate.tier,
        archetype: creatureUpdate.archetype,
      },
      streak: creatureUpdate.streak,
    });
  } catch (error) {
    console.error("Diary API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
