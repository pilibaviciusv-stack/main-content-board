import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cukbjcsawvttcuaqjphz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1a2JqY3Nhd3Z0dGN1YXFqcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTU3OTksImV4cCI6MjA5NzQ5MTc5OX0.QTjyO5gZLaWKnF8ObpBwBD6WmHeOCeGxxokk6wyjrQE';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('sb-access-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For hub routes, verify access
  if (pathname.startsWith('/hub/')) {
    const slug = pathname.split('/')[2];
    if (!slug) return NextResponse.redirect(new URL('/', request.url));

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data } = await supabase
      .from('hub_access')
      .select('status')
      .eq('hub_slug', slug)
      .single();

    // Also check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single();

    if (profile?.role === 'admin') return NextResponse.next();
    if (!data || !['owner', 'unlocked'].includes(data.status)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
