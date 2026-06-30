import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["linkedom", "@mozilla/readability", "cheerio"],
};

export default nextConfig;
