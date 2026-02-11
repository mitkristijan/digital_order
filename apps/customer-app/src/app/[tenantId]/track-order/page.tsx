'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;
  const [orderNumber, setOrderNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (trimmed) {
      router.push(`/${tenantId}/order/${trimmed}`);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh flex flex-col bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link
            href={`/${tenantId}/dashboard`}
            className="p-2 -ml-2 rounded-full text-stone-600 hover:bg-stone-100 active:bg-stone-200 transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-stone-900">Track Order</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-soft border border-stone-100">
            <p className="text-stone-600 mb-6">
              Enter your order number to see the status of your order. You can find it on your receipt or confirmation screen.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-12345"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                autoFocus
              />
              <button
                type="submit"
                disabled={!orderNumber.trim()}
                className="mt-4 w-full py-3.5 rounded-xl bg-orange-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 active:bg-orange-700 transition-colors"
              >
                Track Order
              </button>
            </form>
          </div>

          <Link
            href={`/${tenantId}/menu`}
            className="mt-6 block text-center text-orange-600 font-medium text-sm hover:text-orange-700"
          >
            ← Back to menu
          </Link>
        </div>
      </div>
    </main>
  );
}
