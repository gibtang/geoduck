import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Proxy now only protects API routes
// Page routes are protected by AuthContext (client-side)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebase-auth-token');

  // Only protect API routes
  if (pathname.startsWith('/api/')) {
    // Allow public API endpoints (if any)
    if (pathname === '/api/users/create') {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Protect dashboard and other authenticated routes
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
