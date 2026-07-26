import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSQL } from "@/lib/db";

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
    const imageDataUrl = buildPlaceholderCharacter(profile);

    await sql`
      UPDATE mirror_starting_profiles
      SET character_image = ${imageDataUrl},
          updated_at = NOW()
      WHERE user_id = ${profile.user_id}
    `;

    return NextResponse.json({
      generated: true,
      image: imageDataUrl,
      cached: false,
    });
  } catch (err) {
    console.error("Character generation error:", err);
    return NextResponse.json({ error: "Character generation failed" }, { status: 500 });
  }
}

function buildPlaceholderCharacter(profile: {
  sex: string;
  age: number;
  occupation: string;
  hobbies: string;
  consistent_work: string;
  consistent_personal: string;
}) {
  const sexColor = profile.sex === "male" ? "7cb4ff" : "ff9fd2";
  const accentColor = profile.sex === "male" ? "a78bfa" : "f472b6";
  const label = profile.occupation.slice(0, 18).toUpperCase();
  const personal = profile.consistent_personal.slice(0, 18).toUpperCase();

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024" viewBox="0 0 768 1024">
    <defs>
      <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#14141b" />
        <stop offset="100%" stop-color="#09090d" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="35%" r="45%">
        <stop offset="0%" stop-color="#${accentColor}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#${accentColor}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="768" height="1024" fill="url(#bg)" />
    <rect width="768" height="1024" fill="url(#glow)" />

    <circle cx="384" cy="250" r="68" fill="#${sexColor}" fill-opacity="0.18" stroke="rgba(255,255,255,0.18)" stroke-width="3" />
    <rect x="318" y="330" width="132" height="240" rx="54" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" stroke-width="3" />
    <rect x="275" y="360" width="36" height="190" rx="18" fill="rgba(255,255,255,0.05)" />
    <rect x="457" y="360" width="36" height="190" rx="18" fill="rgba(255,255,255,0.05)" />
    <rect x="338" y="570" width="32" height="205" rx="16" fill="rgba(255,255,255,0.05)" />
    <rect x="398" y="570" width="32" height="205" rx="16" fill="rgba(255,255,255,0.05)" />

    <rect x="184" y="818" width="400" height="1" fill="rgba(255,255,255,0.08)" />

    <text x="384" y="860" text-anchor="middle" fill="#ececf1" font-family="Arial, sans-serif" font-size="22" font-weight="700">STARTER FORM</text>
    <text x="384" y="896" text-anchor="middle" fill="#9a9aaa" font-family="Arial, sans-serif" font-size="14" letter-spacing="2">${escapeXml(label)}</text>
    <text x="384" y="922" text-anchor="middle" fill="#7a7a88" font-family="Arial, sans-serif" font-size="12" letter-spacing="2">${escapeXml(personal)}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
