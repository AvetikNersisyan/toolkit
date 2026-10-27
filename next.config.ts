import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // WebP for browsers that accept it (all current ones); Next falls back to JPEG for the rest. No AVIF: slow to encode.
    formats: ["image/webp"],
    // Only uploaded product photos and the logo go through the optimizer.
    localPatterns: [{ pathname: "/uploads/**" }, { pathname: "/brand/**" }],
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [128, 256, 384],
    // Upload names are random and never reused, so resized copies can be kept for a year.
    minimumCacheTTL: 31536000,
  },
  experimental: {
    // Admin uploads (photos up to 15 MB, videos up to 60 MB) go through server actions...
    serverActions: { bodySizeLimit: "70mb" },
    // ...and through the /admin auth middleware, which otherwise cuts request bodies at 10 MB.
    middlewareClientMaxBodySize: "70mb",
  },
};

export default nextConfig;
