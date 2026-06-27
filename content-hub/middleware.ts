import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow these
  if (
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('favicon')
  ) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie (they store it as sb-<project>-auth-token)
  const cookies = request.cookies;
  const hasSession = [...cookies.getAll()].some(c => 
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
