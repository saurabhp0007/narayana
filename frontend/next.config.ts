import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.narayanenterprise.in',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.ts',
    deviceSizes: [640, 828, 1080, 1280, 1920],
  },
};

export default nextConfig;
