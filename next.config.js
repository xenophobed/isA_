/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['via.placeholder.com'],
    unoptimized: true
  },
  env: {
    REACT_APP_AUTH0_DOMAIN: process.env.REACT_APP_AUTH0_DOMAIN,
    REACT_APP_AUTH0_CLIENT_ID: process.env.REACT_APP_AUTH0_CLIENT_ID,
    REACT_APP_AUTH0_AUDIENCE: process.env.REACT_APP_AUTH0_AUDIENCE,
    REACT_APP_BASE_URL: process.env.REACT_APP_BASE_URL,
    REACT_APP_AGENT_SERVICE_URL: process.env.REACT_APP_AGENT_SERVICE_URL,
    REACT_APP_MCP_SERVICE_URL: process.env.REACT_APP_MCP_SERVICE_URL,
    REACT_APP_MODEL_SERVICE_URL: process.env.REACT_APP_MODEL_SERVICE_URL,
    REACT_APP_USER_SERVICE_URL: process.env.REACT_APP_USER_SERVICE_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/:path*'
      }
    ]
  }
}

module.exports = nextConfig