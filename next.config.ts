import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["image.tmdb.org", "lh3.googleusercontent.com", "s.gravatar.com"],
  },
  env: {
    NEXT_PUBLIC_AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  },
};

export default nextConfig;
