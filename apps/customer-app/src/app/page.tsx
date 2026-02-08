'use client';

import Link from 'next/link';
import { useBranding } from '@/hooks/useBranding';
import { CUSTOMER_TENANT } from '@/config/tenant';

export default function Home() {
  const branding = useBranding(CUSTOMER_TENANT);

  const bgImage = branding.heroBackgroundImage;
  const heroStyle = {
    background: `linear-gradient(135deg, ${branding.heroGradientStart} 0%, ${branding.heroGradientMid} 50%, ${branding.heroGradientEnd} 100%)`,
    paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
    paddingBottom: 80,
    paddingLeft: 24,
    paddingRight: 24,
  } as const;

  const contentBgLayerStyle = bgImage
    ? {
        position: 'absolute' as const,
        inset: 0,
        background: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 0,
      }
    : null;

  const styles = {
    card: {
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: 16,
      padding: 24,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(245,245,244,0.8)',
      marginBottom: 20,
      display: 'block',
      textDecoration: 'none',
    },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    title: { fontSize: 20, fontWeight: 600, color: '#1c1917', marginBottom: 6 },
    desc: { fontSize: 14, color: '#78716c', lineHeight: 1.5, marginBottom: 16 },
    cta: { fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 },
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Hero */}
      <div style={heroStyle}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {branding.appName}
        </h1>
        <p
          style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.95)',
            marginTop: 12,
            marginBottom: 0,
            maxWidth: 320,
          }}
        >
          Order food from your favorite restaurants
        </p>
      </div>

      {/* Cards - white content area with optional background */}
      <div
        style={{
          flex: 1,
          marginTop: -40,
          padding: '0 20px 32px',
          maxWidth: 480,
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: bgImage ? undefined : '#fafaf9',
        }}
      >
        {contentBgLayerStyle && <div style={contentBgLayerStyle} aria-hidden />}
        <div style={{ position: 'relative', zIndex: 1, paddingTop: '2rem' }}>
        <Link href={`/${CUSTOMER_TENANT}/menu`} style={{ textDecoration: 'none' }}>
          <div style={styles.card} data-card>
            <div style={{ ...styles.iconBox, background: `${branding.primaryColor}15` }}>
              <svg
                width={28}
                height={28}
                viewBox="0 0 24 24"
                fill="none"
                stroke={branding.primaryColor}
                strokeWidth={2}
              >
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 style={styles.title}>Browse Menu</h2>
            <p style={styles.desc}>Explore our delicious menu items and special offers</p>
            <span style={{ ...styles.cta, color: branding.primaryColor }}>
              View Menu
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>

        <Link href="/track-order" style={{ textDecoration: 'none' }}>
          <div style={styles.card} data-card>
            <div style={{ ...styles.iconBox, background: `${branding.accentColor}15` }}>
              <svg
                width={28}
                height={28}
                viewBox="0 0 24 24"
                fill="none"
                stroke={branding.accentColor}
                strokeWidth={2}
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 style={styles.title}>Track Order</h2>
            <p style={styles.desc}>Check the status of your current order</p>
            <span style={{ ...styles.cta, color: branding.accentColor }}>
              My Orders
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>
        </div>
      </div>
    </main>
  );
}
