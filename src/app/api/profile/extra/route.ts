import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSQL } from "@/lib/db";

// POST — save extra info for EI compute
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSQL();
  const email = session.user.email.toLowerCase().trim();
  const body = await req.json();
  const { extraInfo } = body;

  if (!extraInfo || typeof extraInfo !== "string") {
    return NextResponse.json({ error: "Extra info must be a string" }, { status: 400 });
  }

  if (extraInfo.trim().length > 2000) {
    return NextResponse.json({ error: "Extra info must be under 2000 characters" }, { status: 400 });
  }

  const userRows = await sql`SELECT id FROM mirror_users WHERE email = ${email}`;
  if (userRows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userId = userRows[0].id;

  await sql`
    UPDATE mirror_starting_profiles
    SET extra_info = ${extraInfo.trim().slice(0, 2000)},
        updated_at = NOW()
    WHERE user_id = ${userId}
  `;

  return NextResponse.json({ saved: true });
}
