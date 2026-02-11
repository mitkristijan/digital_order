'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useBranding } from '@/hooks/useBranding';
import { ImageUpload } from '@/components/ImageUpload';
import { Spinner } from '@digital-order/ui';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';

type TabId = 'branding' | 'profile';

export default function SettingsPage() {
  const params = useParams();
  const urlTenantId = params?.tenantId as string;
  const { tenantId: authTenantId, menuSlug, user, refetchUser } = useAuth();
  // Use auth tenantId (UUID) for TENANT_ADMIN - ensures correct tenant when subdomain/slug mismatches
  const effectiveTenant =
    (user?.role === 'TENANT_ADMIN' && authTenantId) ? authTenantId
    : (urlTenantId || authTenantId || (user?.role === 'SUPER_ADMIN' ? 'demo-tenant' : null));
  const [activeTab, setActiveTab] = useState<TabId>('branding');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'branding', label: 'Branding' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50/80">
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/80 shadow-soft sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure your preferences</p>
            <div className="flex gap-1 mt-4 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {effectiveTenant && (
            <CustomerMenuLink
              tenantId={effectiveTenant}
              menuSlug={menuSlug}
              onRegenerated={refetchUser}
            />
          )}
          {activeTab === 'branding' && effectiveTenant && <BrandingTab tenantId={effectiveTenant} />}
          {activeTab === 'profile' && <ProfileTab onSaved={refetchUser} />}
        </div>
      </div>
    </AuthGuard>
  );
}

function CustomerMenuLink({
  tenantId,
  menuSlug,
  onRegenerated,
}: {
  tenantId: string;
  menuSlug: string | null;
  onRegenerated: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || 'http://localhost:3001';
  const slug = menuSlug ?? tenantId;
  const menuUrl = `${baseUrl}/${slug}/menu`;
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const { data } = await apiClient.patch(
        `/tenants/${encodeURIComponent(tenantId)}/regenerate-menu-slug`,
        undefined,
        { params: { tenantId } }
      );
      await onRegenerated();
      queryClient.invalidateQueries({ queryKey: ['branding', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId] });
      if (data?.menuSlug) {
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Regenerate failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to regenerate link';
      alert(msg);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="rounded-xl px-5 py-6 bg-white border border-gray-200/80 shadow-card max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Your Menu for Customers</h2>
      <p className="text-sm text-gray-500 mb-4">
        Share this link with your customers so they can browse and order from your menu.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="text"
          readOnly
          value={menuUrl}
          className="flex-1 w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-mono text-sm"
        />
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors whitespace-nowrap"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14L21 3" />
          </svg>
          Open Menu
        </a>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-500">
          Each account has its own menu. Regenerate the link to invalidate the old one if it was shared.
        </p>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="text-sm font-medium text-amber-600 hover:text-amber-700 disabled:opacity-50"
        >
          {isRegenerating ? 'Regenerating...' : 'Regenerate link'}
        </button>
      </div>
    </div>
  );
}

function BrandingTab({ tenantId }: { tenantId: string }) {
  const { data: branding, isLoading, updateBranding, isUpdating } = useBranding(tenantId);
  const [form, setForm] = useState({
    primaryColor: '',
    accentColor: '',
    heroGradientStart: '',
    heroGradientMid: '',
    heroGradientEnd: '',
    appName: '',
    heroBackgroundImage: '',
  });
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (branding) {
      setForm({
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
        heroGradientStart: branding.heroGradientStart,
        heroGradientMid: branding.heroGradientMid,
        heroGradientEnd: branding.heroGradientEnd,
        appName: branding.appName,
        heroBackgroundImage: branding.heroBackgroundImage ?? '',
      });
    }
  }, [branding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    await updateBranding({ ...form, heroBackgroundImage: form.heroBackgroundImage || null });
    setSaved(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl px-5 py-6 bg-white border border-gray-200/80 shadow-card max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Customer UI Branding</h2>
      <p className="text-sm text-gray-500 mb-6">
        Customize colors and branding shown to customers in the ordering app.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">App Name</label>
          <input
            type="text"
            value={form.appName}
            onChange={(e) => setForm((f) => ({ ...f, appName: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Digital Order"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Color</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
            />
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-900 font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Accent Color</label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={form.accentColor}
              onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
              className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
            />
            <input
              type="text"
              value={form.accentColor}
              onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-900 font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero Gradient</label>
          <p className="text-xs text-gray-500 mb-2">The gradient shown on the customer app home screen</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="block text-xs text-gray-500 mb-1">Start</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.heroGradientStart}
                  onChange={(e) => setForm((f) => ({ ...f, heroGradientStart: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={form.heroGradientStart}
                  onChange={(e) => setForm((f) => ({ ...f, heroGradientStart: e.target.value }))}
                  className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-gray-900 font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <span className="block text-xs text-gray-500 mb-1">Mid</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.heroGradientMid}
                  onChange={(e) => setForm((f) => ({ ...f, heroGradientMid: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={form.heroGradientMid}
                  onChange={(e) => setForm((f) => ({ ...f, heroGradientMid: e.target.value }))}
                  className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-gray-900 font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <span className="block text-xs text-gray-500 mb-1">End</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.heroGradientEnd}
                  onChange={(e) => setForm((f) => ({ ...f, heroGradientEnd: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={form.heroGradientEnd}
                  onChange={(e) => setForm((f) => ({ ...f, heroGradientEnd: e.target.value }))}
                  className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-gray-900 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <ImageUpload
            label="Content Background Image"
            value={form.heroBackgroundImage}
            onChange={(url) => setForm((f) => ({ ...f, heroBackgroundImage: url }))}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">Saved successfully</span>
          )}
        </div>
      </form>
    </div>
  );
}

function ProfileTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [saved, setSaved] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  React.useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        avatar: user.avatar ?? '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setIsUpdating(true);
    try {
      await apiClient.patch('/auth/me', {
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        email: form.email || null,
        phone: form.phone,
        avatar: form.avatar || null,
      });
      await onSaved();
      setSaved(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile';
      alert(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl px-5 py-6 bg-white border border-gray-200/80 shadow-card max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Profile Information</h2>
      <p className="text-sm text-gray-500 mb-6">
        Update your account details. All fields are editable.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="First name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="Last name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="+1234567890"
          />
        </div>

        <div>
          <ImageUpload
            label="Profile Picture"
            value={form.avatar}
            onChange={(url) => setForm((f) => ({ ...f, avatar: url }))}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">Saved successfully</span>
          )}
        </div>
      </form>
    </div>
  );
}
