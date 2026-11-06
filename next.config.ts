import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // Do not write an AGENTS.md into the repo on every `next dev` (project guidance lives in CLAUDE.md).
  agentRules: false,
}

export default nextConfig
