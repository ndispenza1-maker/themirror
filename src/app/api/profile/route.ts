import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSQL } from "@/lib/db";
import { rateLimit } from "@/lib/security";

// GET — fetch current user's starting profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSQL();
  const email = session.user.email.toLowerCase().trim();

  const rows = await sql`
    SELECT sp.* FROM mirror_starting_profiles sp
    JOIN mirror_users u ON u.id = sp.user_id
    WHERE u.email = ${email}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ completed: false });
  }

  return NextResponse.json({ completed: true, profile: rows[0] });
}

// POST — save starting profile
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSQL();
  const email = session.user.email.toLowerCase().trim();

  // Rate limit: 5 profile saves per hour (prevents spamming)
  const { allowed } = rateLimit(`profile:${email}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = await req.json();
  const { creature, occupation, hobbies, consistentWork, consistentPersonal } = body;

  // Validation
  if (!creature || !occupation || !hobbies || !consistentWork || !consistentPersonal) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!["deer", "snake", "dog"].includes(creature)) {
    return NextResponse.json({ error: "Invalid creature value" }, { status: 400 });
  }

  // Sanitize string lengths
  const cleanOccupation = String(occupation).trim().slice(0, 120);
  const cleanHobbies = String(hobbies).trim().slice(0, 200);
  const cleanWork = String(consistentWork).trim().slice(0, 200);
  const cleanPersonal = String(consistentPersonal).trim().slice(0, 200);

  if (!cleanOccupation || !cleanHobbies || !cleanWork || !cleanPersonal) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Get user ID
  const userRows = await sql`SELECT id FROM mirror_users WHERE email = ${email}`;
  if (userRows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userId = userRows[0].id;

  // Upsert starting profile
  await sql`
    INSERT INTO mirror_starting_profiles (user_id, creature, occupation, hobbies, consistent_work, consistent_personal)
    VALUES (${userId}, ${creature}, ${cleanOccupation}, ${cleanHobbies}, ${cleanWork}, ${cleanPersonal})
    ON CONFLICT (user_id) DO UPDATE SET
      creature = EXCLUDED.creature,
      occupation = EXCLUDED.occupation,
      hobbies = EXCLUDED.hobbies,
      consistent_work = EXCLUDED.consistent_work,
      consistent_personal = EXCLUDED.consistent_personal,
      updated_at = NOW()
  `;

  return NextResponse.json({ completed: true });
}
