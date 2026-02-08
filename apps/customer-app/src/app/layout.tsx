import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Digital Order - Quick & Easy Ordering',
  description: 'Scan QR code and order from your table',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Digital Order',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#EA580C',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: '*{box-sizing:border-box}body{margin:0;background:#fafaf9;color:#1c1917;font-family:system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}' }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#EA580C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-stone-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
