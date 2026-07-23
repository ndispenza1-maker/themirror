import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSQL } from "@/lib/db";

/**
 * Auth configuration.
 * 
 * For MVP, using a simple email-based system.
 * Swap to magic link or OAuth when ready.
 */
export const authOptions: NextAuthOptions = {
  providers: [
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
          SELECT id, email, display_name FROM users WHERE email = ${email}
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
          INSERT INTO users (email)
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
    async jwt({ token, user }) {
      if (user) {
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
