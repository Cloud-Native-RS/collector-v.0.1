import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth/middleware";

/**
 * Middleware for Next.js 16
 * Handles route redirects and legacy route migrations
 */
export default function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Redirect URLs that incorrectly include route groups (e.g., /(auth)/login)
  if (pathname.includes("/(auth)/")) {
    const cleanPath = pathname.replace("/(auth)/", "/");
    const redirectUrl = new URL(cleanPath, request.url);
    // Preserve query parameters
    searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect root to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Public routes - allow access without authentication
  const publicRoutes = ["/login", "/signup", "/forgot-password"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Protected routes - authentication is handled client-side
  // We allow the request to proceed and let client-side code check localStorage
  // This prevents redirect loops when token is in localStorage but cookie hasn't been set yet

  // Redirect legacy routes to new route group structure
  if (pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/(guest)")) {
    return NextResponse.redirect(new URL(pathname.replace("/dashboard", "/app"), request.url));
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
