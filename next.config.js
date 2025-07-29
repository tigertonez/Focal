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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...config.externals,
        /@opentelemetry\/instrumentation/,
        /opentelemetry-sdk-trace-base/,
        /@opentelemetry\/resources/,
        /@opentelemetry\/sdk-trace-base/,
        /@opentelemetry\/sdk-trace-node/,
        /require-in-the-middle/,
        /semver/,
        /cls-hooked/,
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
