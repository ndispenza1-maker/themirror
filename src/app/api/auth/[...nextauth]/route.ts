import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getSQL } from "@/lib/db";

/**
 * Auth configuration.
 * 
 * For MVP, using a simple email-based system.
 * Swap to magic link or OAuth when ready.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const sql = getSQL();
        const email = credentials.email.toLowerCase().trim();

        // Find or create user
        const existing = await sql`
          SELECT id, email, display_name FROM mirror_users WHERE email = ${email}
        `;

        if (existing.length > 0) {
          return {
            id: existing[0].id as string,
            email: existing[0].email as string,
            name: existing[0].display_name as string | null,
          };
        }

        // Auto-create for MVP (replace with verification later)
        const created = await sql`
          INSERT INTO mirror_users (email)
          VALUES (${email})
          RETURNING id, email, display_name
        `;

        return {
          id: created[0].id as string,
          email: created[0].email as string,
          name: created[0].display_name as string | null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
