/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@digital-order/ui', '@digital-order/types', '@digital-order/utils', '@digital-order/config'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
