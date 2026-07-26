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
    SELECT sp.background_image
    FROM mirror_users u
    JOIN mirror_starting_profiles sp ON sp.user_id = u.id
    WHERE u.email = ${email}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ generated: false, image: null });
  }

  return NextResponse.json({
    generated: rows[0].background_image !== null,
    image: rows[0].background_image,
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
    background_image: string | null;
    extra_info: string | null;
  };

  if (profile.background_image) {
    return NextResponse.json({
      generated: true,
      image: profile.background_image,
      cached: true,
    });
  }

  try {
    const prompt = buildBackgroundPrompt(profile);

    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: "landscape_16_9",
        num_images: 1,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
    });

    const imageUrl = result.data?.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL returned from fal.ai");
    }

    await sql`
      UPDATE mirror_starting_profiles
      SET background_image = ${imageUrl},
          updated_at = NOW()
      WHERE user_id = ${profile.user_id}
    `;

    return NextResponse.json({
      generated: true,
      image: imageUrl,
      cached: false,
    });
  } catch (err) {
    console.error("Background generation error:", err);
    return NextResponse.json({ error: "Background generation failed" }, { status: 500 });
  }
}

function buildBackgroundPrompt(profile: {
  occupation: string;
  hobbies: string;
  consistent_work: string;
  consistent_personal: string;
  extra_info: string | null;
}): string {
  const work = profile.consistent_work.toLowerCase();
  const personal = profile.consistent_personal.toLowerCase();
  const hobbies = profile.hobbies.toLowerCase();
  const occupation = profile.occupation.toLowerCase();
  const extra = (profile.extra_info || "").toLowerCase();

  // Gather environmental cues from all profile data
  const cues: string[] = [];

  // Work environment cues
  if (work.includes("hvac") || work.includes("mechanic") || work.includes("repair") || work.includes("facilities") || occupation.includes("hvac") || occupation.includes("technician")) {
    cues.push("mechanical workshop interior", "tool walls with wrenches and gauges", "ductwork and copper piping", "industrial workbench");
  }
  if (work.includes("build") || work.includes("construct") || work.includes("carpent")) {
    cues.push("woodworking shop", "sawdust in the air", "lumber stacked against walls");
  }
  if (work.includes("office") || work.includes("computer") || work.includes("software")) {
    cues.push("modern workspace", "multiple monitors", "city view through windows");
  }

  // Personal/hobby cues
  if (personal.includes("skate") || hobbies.includes("skate")) {
    cues.push("concrete half-pipe visible in distance", "worn skateboard ramps");
  }
  if (personal.includes("surf") || hobbies.includes("surf")) {
    cues.push("ocean visible through open doors", "salt-worn wood", "golden coastal light");
  }
  if (personal.includes("jiu jitsu") || hobbies.includes("jiu jitsu") || hobbies.includes("martial")) {
    cues.push("training mats rolled in corner", "heavy bag hanging");
  }
  if (personal.includes("golf") || hobbies.includes("golf")) {
    cues.push("green rolling hills visible outside", "morning mist on grass");
  }
  if (personal.includes("music") || hobbies.includes("music")) {
    cues.push("guitar or instruments on wall hooks", "small amplifier");
  }
  if (personal.includes("build") || hobbies.includes("build")) {
    cues.push("half-finished projects on workbench", "hand tools organized on pegboard");
  }

  // Extra info cues
  if (extra.includes("nature") || extra.includes("outdoor")) {
    cues.push("large open bay doors revealing natural landscape");
  }
  if (extra.includes("tech") || extra.includes("engineer")) {
    cues.push("circuit boards and electronics on shelves");
  }

  // Default baseline if no strong cues
  if (cues.length === 0) {
    cues.push("clean workshop garage", "organized tool wall", "open bay door with natural light");
  }

  const environmentDetails = cues.join(", ");

  return `Wide cinematic landscape scene, no people, no characters, no figures. A personal workshop/garage environment viewed from inside looking out. ${environmentDetails}. The space feels lived-in, personal, well-used but organized. Large open bay door or windows on one side letting in warm golden hour light. The outdoor area beyond shows a mix of nature and built environment.

Art direction: Semi-stylized 3D render quality, Fortnite/Pixar environmental art style. Cinematic widescreen composition. Dramatic warm lighting with cool shadow contrast. Rich detail and depth. Moody atmosphere. No text, no UI, no watermarks, no people, no characters.`;
}
