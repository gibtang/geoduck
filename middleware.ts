import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware now only protects API routes
// Page routes are protected by AuthContext (client-side)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('firebase-auth-token');

    // Allow public API endpoints (if any)
    if (pathname === '/api/users/create') {
      return NextResponse.next();
    }

  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (!token && pathname.startsWith('/keywords')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (!token && pathname.startsWith('/prompts')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (!token && pathname.startsWith('/results')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
