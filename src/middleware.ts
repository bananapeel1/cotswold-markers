import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get("__session");

    // Middleware runs on Edge — can only check cookie existence here.
    // Actual session validation + admin role check happens in each API route
    // via verifyAdmin() which runs in the Node.js runtime.
    if (!cookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
