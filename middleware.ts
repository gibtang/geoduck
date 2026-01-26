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

    // Protect all other API routes
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
