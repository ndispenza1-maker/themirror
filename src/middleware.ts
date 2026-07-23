import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // Protect all routes except login, static assets, and API auth
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
