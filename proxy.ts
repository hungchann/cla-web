import { NextRequest, NextResponse } from "next/server";

/**
 * Auth-protected routes: yêu cầu access_token cookie.
 * Proxy chỉ kiểm tra sự tồn tại của token (không gọi Directus).
 * Validation thực sự do API interceptor xử lý (401 → refresh).
 */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/bilingual",
  "/video",
  "/flashcard",
  "/grammar",
  "/speaking",
  "/stories",
  "/courses",
  "/profile",
];

/** Routes không render Header, không cần guard */
const AUTH_ONLY_ROUTES = ["/sign-in", "/register", "/forgot-password"];

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route));
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const hasToken = Boolean(accessToken);

  // Root "/" — landing page nếu chưa login, dashboard nếu đã login
  if (pathname === "/") {
    if (hasToken) {
      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return response;
    }
    return NextResponse.next();
  }

  // Trang auth (sign-in, register…) — nếu đã login → về dashboard
  if (isAuthRoute(pathname)) {
    if (hasToken) {
      const redirectTo = searchParams.get("redirect") ?? "/dashboard";
      const response = NextResponse.redirect(new URL(redirectTo, request.url));
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return response;
    }
    return NextResponse.next();
  }

  // Protected routes — nếu chưa login → về sign-in với redirect param
  if (isProtected(pathname)) {
    if (!hasToken) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(signInUrl);
      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return response;
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - /api/* (Next.js API routes)
     * - /images/* (public images)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|images/).*)",
  ],
};
