/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@digital-order/ui', '@digital-order/types', '@digital-order/utils', '@digital-order/config'],
  images: {
    domains: ['localhost'],
  },
  // PWA optimization
  compress: true,
  // Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
