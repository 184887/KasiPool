import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Stop `next dev` rewriting AGENTS.md; the same advice lives there in our own words
  agentRules: false,
};

export default nextConfig;
