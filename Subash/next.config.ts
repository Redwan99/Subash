import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    formats: ["image/avif", "image/webp"],  // AVIF is ~50% smaller than WebP
    minimumCacheTTL: 86400,                  // cache optimised images for 24h
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fimgs.net", // Fragrantica image CDN
      },
      {
        protocol: "https",
        hostname: "**.fragrantica.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile pics
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com", // Firebase Storage (decant proof images)
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com", // FB profile pics
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Perfume bottle images from import
      },
      {
        protocol: "https",
        hostname: "picsum.photos", // Reliable placeholder images
      },
    ],
  },

  experimental: {
    serverActions: {
      // Local dev + production domain both allowed
      allowedOrigins: ["localhost:3000", "localhost:3001", "subash.com.bd", "www.subash.com.bd"],
    },
  },
};

export default nextConfig;
