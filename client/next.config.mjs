/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // Proxy all frontend /api/* requests to your Render backend
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "https://vantage-rms-backend.onrender.com"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;