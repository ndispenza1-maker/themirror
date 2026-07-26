import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter.
 * For Vercel serverless, this resets on cold start — but still catches burst abuse.
 * For persistent rate limiting, swap to Redis/Upstash later.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

/**
 * Get user ID from session email. Returns null if not found.
 */
export async function getUserIdFromEmail(email: string): Promise<string | null> {
  const sql = getSQL();
  const rows = await sql`SELECT id FROM mirror_users WHERE email = ${email.toLowerCase().trim()}`;
  return rows.length > 0 ? (rows[0].id as string) : null;
}

/**
 * Validate that a string is within bounds.
 */
export function sanitizeString(input: unknown, maxLength: number): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}
