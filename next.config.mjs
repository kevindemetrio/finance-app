/** @type {import('next').NextConfig} */

// La CSP ya NO se define aquí — se genera dinámicamente en middleware.ts con un
// nonce por petición, lo que elimina 'unsafe-inline' de script-src.
const securityHeaders = [
  { key: "X-Frame-Options",            value: "DENY" },
  { key: "X-Content-Type-Options",     value: "nosniff" },
  { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control",     value: "on" },
  { key: "Strict-Transport-Security",  value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  experimental: {
    optimizePackageImports: ["jspdf"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error"] }
      : false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
