import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const NON_TENANT_ROUTES = ['', 'track-order', '_next', 'api', 'favicon'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return NextResponse.next();

  const first = segments[0];
  if (NON_TENANT_ROUTES.includes(first) || first.startsWith('_')) {
    return NextResponse.next();
  }

  // Tenant routes: /[tenantId]/menu, /[tenantId]/checkout, etc.
  // Allow any tenant slug - each tenant has their own menu at /{slug}/menu
  // When visiting tenant root (e.g. /nikodir), redirect to menu
  if (segments.length === 1) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/menu`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
