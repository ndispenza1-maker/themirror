import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSQL } from "@/lib/db";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSQL();
  const email = session.user.email.toLowerCase().trim();

  const rows = await sql`
    SELECT sp.character_image
    FROM mirror_users u
    JOIN mirror_starting_profiles sp ON sp.user_id = u.id
    WHERE u.email = ${email}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ generated: false, image: null });
  }

  return NextResponse.json({
    generated: rows[0].character_image !== null,
    image: rows[0].character_image,
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSQL();
  const email = session.user.email.toLowerCase().trim();

  const rows = await sql`
    SELECT u.id as user_id, sp.*
    FROM mirror_users u
    JOIN mirror_starting_profiles sp ON sp.user_id = u.id
    WHERE u.email = ${email}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Starting profile not found" }, { status: 404 });
  }

  const profile = rows[0] as {
    user_id: string;
    sex: string;
    age: number;
    character_image: string | null;
  };

  if (profile.character_image) {
    return NextResponse.json({
      generated: true,
      image: profile.character_image,
      cached: true,
    });
  }

  try {
    const prompt = buildPrompt(profile);
    const openai = getOpenAI();

    // Single call: generate character with transparent background
    const response = await openai.images.generate({
      model: "gpt-image-1.5",
      prompt,
      n: 1,
      size: "1024x1536",
      background: "transparent",
      output_format: "png",
    });

    const imageBase64 = response.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error("No image data returned from OpenAI");
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;

    await sql`
      UPDATE mirror_starting_profiles
      SET character_image = ${imageUrl},
          updated_at = NOW()
      WHERE user_id = ${profile.user_id}
    `;

    return NextResponse.json({
      generated: true,
      image: imageUrl,
      cached: false,
    });
  } catch (err) {
    console.error("Character generation error:", err);
    return NextResponse.json({ error: "Character generation failed" }, { status: 500 });
  }
}

function buildPrompt(profile: {
  sex: string;
  age: number;
}): string {
  const sexLabel = profile.sex === "male" ? "Male" : "Female";

  return `Full-body character portrait, Fortnite art style. ${sexLabel} human, age ${profile.age}, standing in a neutral relaxed pose facing forward. Clean simple outfit — work pants, plain t-shirt, sturdy boots. Nothing flashy. Expression: calm, present, aware. No weapons, no armor, no special effects, no glow. This is a starter form — a human at the beginning of their journey.

Background: solid neutral gray (#505050), flat, no environment, no objects, no gradients. Just the character on a plain gray backdrop.

Art direction: Semi-stylized 3D render quality like Fortnite or Pixar. Dramatic cinematic lighting from above and slightly in front. Dark moody tones with subtle warm color accents on the character. Full body visible head to toe, feet touching ground. No text, no UI elements, no watermarks, no logos. Character centered in frame with space around all edges.`;
}
