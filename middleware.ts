import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/signin', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('firebase-auth-token');

  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (!token && pathname.startsWith('/products')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (!token && pathname.startsWith('/prompts')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (!token && pathname.startsWith('/execute')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (!token && pathname.startsWith('/results')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
