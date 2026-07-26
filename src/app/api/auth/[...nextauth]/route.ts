import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSQL } from "@/lib/db";

/**
 * Auth configuration.
 * Google OAuth only — no credentials/email login.
 * One account per Google email. No multi-account abuse.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (was 30 — tighter session window)
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const sql = getSQL();
        const email = user.email.toLowerCase().trim();
        const existing = await sql`
          SELECT id FROM mirror_users WHERE email = ${email}
        `;
        if (existing.length === 0) {
          await sql`
            INSERT INTO mirror_users (email, display_name)
            VALUES (${email}, ${user.name || null})
          `;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google" && user.email) {
        const sql = getSQL();
        const existing = await sql`
          SELECT id FROM mirror_users WHERE email = ${user.email.toLowerCase().trim()}
        `;
        if (existing.length > 0) {
          token.userId = existing[0].id as string;
        }
      } else if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
