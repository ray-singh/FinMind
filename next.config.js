/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle better-sqlite3 native module
    if (isServer) {
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3'
      });
    }
    return config;
  },
}

module.exports = nextConfig
