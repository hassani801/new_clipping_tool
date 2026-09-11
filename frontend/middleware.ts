import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/pricing',
];

// Routes that are always allowed regardless of auth (Next.js internals, static assets)
const ALWAYS_ALLOW_PREFIXES = [
  '/_next/',
  '/api/',
  '/favicon',
  '/public/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals, API routes, and static assets
  if (ALWAYS_ALLOW_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Always allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for JWT auth cookie (set by the backend on login)
  const token = request.cookies.get('access_token');

  if (!token?.value) {
    // Redirect unauthenticated users to /login with the original URL as a
    // ?redirect query param so they can be sent back after signing in.
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match every route except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
