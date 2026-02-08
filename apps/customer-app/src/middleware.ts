import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CUSTOMER_TENANT } from './config/tenant';

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
  // Guard: redirect to our tenant if a different tenant is in the URL
  if (first !== CUSTOMER_TENANT) {
    const rest = segments.slice(1).join('/');
    const newPath = rest ? `/${CUSTOMER_TENANT}/${rest}` : `/${CUSTOMER_TENANT}`;
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
