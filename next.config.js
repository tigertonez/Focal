

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'puppeteer', 'handlebars'],
  env: {
    NEXT_PUBLIC_BASE_PATH: '',
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...config.watchOptions.ignored,
        '**/next.config.js',
      ]
    }
    return config;
  },
};

module.exports = nextConfig;
