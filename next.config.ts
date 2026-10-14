import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

type ShopifyRedirect = { source: string; destination: string; permanent: boolean };

function loadShopifyRedirects(): ShopifyRedirect[] {
  const file = path.join(process.cwd(), "data", "shopify-redirects.json");
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, "utf8")) as ShopifyRedirect[];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  async redirects() {
    return loadShopifyRedirects();
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: [
              'accelerometer=(self "https://checkout.razorpay.com" "https://api.razorpay.com" "https://razorpay.com")',
              'gyroscope=(self "https://checkout.razorpay.com" "https://api.razorpay.com" "https://razorpay.com")',
            ].join(", "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  experimental: {
    authInterrupts: true,
    typedEnv: true,
  },
  typescript: {
    tsconfigPath: "tsconfig.json",
  },
  typedRoutes: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "jayantrohila57",
  project: "lucsum",
  widenClientFileUpload: true,
  release: {
    create: false,
  },
  sourcemaps: {
    disable: true,
  },
  silent: !process.env.CI,
});
