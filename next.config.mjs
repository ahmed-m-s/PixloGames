import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/games/panda-mart/index.html',
        destination: '/playable-games/panda-mart/index.html',
        permanent: false
      },
      {
        source: '/games/panda-mart/game.js',
        destination: '/playable-games/panda-mart/game.js',
        permanent: false
      },
      {
        source: '/games/panda-mart/style.css',
        destination: '/playable-games/panda-mart/style.css',
        permanent: false
      },
      {
        source: '/games/panda-mart/assets/:path*',
        destination: '/playable-games/panda-mart/assets/:path*',
        permanent: false
      }
    ];
  }
};

const sentryOptions = {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  disableLogger: true
};

export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
