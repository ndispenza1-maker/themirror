import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSQL } from "@/lib/db";
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

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
    occupation: string;
    hobbies: string;
    relationship_status: string;
    consistent_work: string;
    consistent_personal: string;
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

    // Step 1: Generate character image
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: "portrait_4_3",
        num_images: 1,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
    });

    const rawImageUrl = result.data?.images?.[0]?.url;

    if (!rawImageUrl) {
      throw new Error("No image URL returned from fal.ai");
    }

    // Step 2: Remove background to get transparent PNG cutout
    const bgRemoval = await fal.subscribe("fal-ai/birefnet/v2", {
      input: {
        image_url: rawImageUrl,
        model: "General Use (Light)",
        operating_resolution: "1024x1024",
        output_format: "png",
      },
    });

    const cutoutUrl = bgRemoval.data?.image?.url;

    if (!cutoutUrl) {
      throw new Error("Background removal failed");
    }

    // Store the transparent cutout URL
    await sql`
      UPDATE mirror_starting_profiles
      SET character_image = ${cutoutUrl},
          updated_at = NOW()
      WHERE user_id = ${profile.user_id}
    `;

    return NextResponse.json({
      generated: true,
      image: cutoutUrl,
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
  consistent_work: string;
  consistent_personal: string;
}): string {
  // Build background from consistency data
  const workContext = profile.consistent_work.toLowerCase();
  const personalContext = profile.consistent_personal.toLowerCase();

  let background = "industrial workshop with warm overhead lighting, concrete floor, workbenches visible in background, open garage door showing outdoor landscape beyond";

  if (personalContext.includes("surf") || personalContext.includes("beach") || personalContext.includes("ocean")) {
    background = "coastal workshop, ocean visible through open bay doors, warm golden hour light, surfboards leaning against wall in background";
  } else if (personalContext.includes("skate") || personalContext.includes("urban")) {
    background = "urban workshop garage, graffiti-touched walls, city skyline through open door, warm tungsten lighting";
  } else if (workContext.includes("hvac") || workContext.includes("mechanic") || workContext.includes("repair") || workContext.includes("build")) {
    background = "mechanical workshop, tool walls, ductwork and equipment visible, warm industrial lighting, open bay door showing tree-lined outdoor space";
  } else if (personalContext.includes("nature") || personalContext.includes("hik") || personalContext.includes("outdoor")) {
    background = "rustic workshop at forest edge, open doors revealing mountain trail, natural light filtering through trees";
  } else if (personalContext.includes("music") || personalContext.includes("art") || personalContext.includes("creat")) {
    background = "creative studio workshop, instruments and tools on walls, warm ambient lighting, large windows showing evening sky";
  }

  const sexLabel = profile.sex === "male" ? "Male" : "Female";

  return `Full-body character portrait, Fortnite art style. ${sexLabel} human, age ${profile.age}, standing in a neutral relaxed pose facing forward. Clean simple outfit — work pants, plain t-shirt, sturdy boots. Nothing flashy. Expression: calm, present, aware. No weapons, no armor, no special effects, no glow. This is a starter form — a human at the beginning of their journey.

Background: ${background}

Art direction: Semi-stylized 3D render quality like Fortnite or Pixar. Dramatic cinematic lighting. Dark moody tones with subtle warm color accents. Full body visible head to toe. No text, no UI elements, no watermarks, no logos.`;
}
