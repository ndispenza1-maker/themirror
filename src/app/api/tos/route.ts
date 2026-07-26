import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSQL } from "@/lib/db";

// GET — check if current user has accepted TOS
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSQL();
  const email = session.user.email.toLowerCase().trim();
  const rows = await sql`
    SELECT tos_accepted_at FROM mirror_users WHERE email = ${email}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    accepted: rows[0].tos_accepted_at !== null,
    acceptedAt: rows[0].tos_accepted_at,
  });
}

// POST — accept TOS
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSQL();
  const email = session.user.email.toLowerCase().trim();

  await sql`
    UPDATE mirror_users
    SET tos_accepted_at = NOW()
    WHERE email = ${email} AND tos_accepted_at IS NULL
  `;

  return NextResponse.json({ accepted: true });
}
