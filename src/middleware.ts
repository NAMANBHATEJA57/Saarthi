import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isSignInPage = req.nextUrl.pathname.startsWith('/sign-in');

  if (!isLoggedIn && !isSignInPage) {
    return Response.redirect(new URL('/sign-in', req.nextUrl));
  }

  if (isLoggedIn && (isSignInPage || req.nextUrl.pathname === '/')) {
    return Response.redirect(new URL('/today', req.nextUrl));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
