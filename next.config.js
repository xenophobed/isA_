/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // 暂时禁用以避免开发模式下的重复渲染
  experimental: {
    appDir: false
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.REACT_APP_AGENT_SERVICE_URL || 'http://localhost:8080'}/api/:path*`,
      },
      {
        source: '/user-api/:path*',
        destination: `${process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:8100'}/api/:path*`,
      },
    ];
  },
  env: {
    REACT_APP_AUTH0_DOMAIN: process.env.REACT_APP_AUTH0_DOMAIN,
    REACT_APP_AUTH0_CLIENT_ID: process.env.REACT_APP_AUTH0_CLIENT_ID,
    REACT_APP_AUTH0_AUDIENCE: process.env.REACT_APP_AUTH0_AUDIENCE,
    REACT_APP_AGENT_SERVICE_URL: process.env.REACT_APP_AGENT_SERVICE_URL,
    REACT_APP_USER_SERVICE_URL: process.env.REACT_APP_USER_SERVICE_URL,
    REACT_APP_MODEL_SERVICE_URL: process.env.REACT_APP_MODEL_SERVICE_URL,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

module.exports = nextConfig