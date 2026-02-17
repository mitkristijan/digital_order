'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string;

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    router.push('/login');
  };

  const base = tenantId ? `/${tenantId}` : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-10">
              <Link
                href={`${base}/dashboard`}
                className="text-lg font-semibold text-brand-600 hover:text-brand-700 transition-colors tracking-tight"
              >
                Digital Order Admin
              </Link>
              <div className="flex gap-1">
                <Link
                  href={`${base}/dashboard`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === `${base}/dashboard` || pathname === base
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Orders
                </Link>
                <Link
                  href={`${base}/menu`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === `${base}/menu`
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Menu
                </Link>
                <Link
                  href={`${base}/tables`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === `${base}/tables`
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Tables
                </Link>
                <Link
                  href={`${base}/analytics`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === `${base}/analytics`
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Analytics
                </Link>
                <Link
                  href={`${base}/settings`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === `${base}/settings`
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Settings
                </Link>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
