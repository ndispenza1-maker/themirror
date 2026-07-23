import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

/**
 * Returns a Neon SQL tagged template function.
 * Lazily initializes on first call.
 */
export function getSQL(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.POSTGRES_URL;
    if (!url) {
      throw new Error("POSTGRES_URL is not set");
    }
    _sql = neon(url);
  }
  return _sql;
}
