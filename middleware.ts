import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/how-it-works(.*)",
  "/pricing(.*)",
  "/contact(.*)",
  "/login(.*)",
  "/register(.*)",
  "/select-role(.*)",
  "/after-login(.*)",
  "/privacy(.*)",
  "/terms(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

const isTeacherRoute = createRouteMatcher(["/teacher(.*)"]);
const isClientRoute = createRouteMatcher(["/client(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isSuperAdminRoute = createRouteMatcher(["/super-admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Always allow public pages
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Always allow API routes (they handle their own auth)
  if (isApiRoute(req)) {
    return NextResponse.next();
  }

  // Not logged in
  if (!userId) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  const metadata = sessionClaims?.metadata as { role?: string } | undefined;
  const role = metadata?.role;

  // No role → select role page
  if (!role) {
    // Don't redirect if already on select-role
    if (!req.nextUrl.pathname.startsWith("/select-role")) {
      return NextResponse.redirect(new URL("/select-role", req.url));
    }
    return NextResponse.next();
  }

  // Role protection
  if (isTeacherRoute(req) && role !== "TEACHER") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (isClientRoute(req) && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (isAdminRoute(req) && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (isSuperAdminRoute(req) && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};