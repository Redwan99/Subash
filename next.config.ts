import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.firebaseio.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://challenges.cloudflare.com wss://*.firebaseio.com https://api.dicebear.com",
              "frame-src 'self' https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],  // AVIF ~50% smaller than WebP
    minimumCacheTTL: 31536000,               // cache optimised images for 1 year
    // Wildcard: allow any remote image URL (Kaggle data has many CDN hosts)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",   // all HTTPS image domains
      },
      {
        protocol: "http",
        hostname: "**",   // all HTTP image domains (fallback / local seeds)
      },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion"],
    serverActions: {
      bodySizeLimit: "10mb",
      // Local dev + production domain + CasaOS allowed
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "subash.com.bd",
        "www.subash.com.bd",
        "192.168.10.8:3000",
      ],
    },
  },

  eslint: {
    // Run ESLint during builds so production catches lint issues too
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,  // Fail the build on any type error
  },
};

export default nextConfig;