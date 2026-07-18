import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Agent SDK (which spawns a bundled binary) out of the server bundle
  // so its executable resolves from node_modules at runtime.
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],

  async headers() {
    return [
      {
        // `/compose` output is a pure function of its URL, so it is cacheable
        // indefinitely — and Vercel does NOT cache function responses by default,
        // which makes this header required rather than an optimization. Long CDN
        // caching is also the primary defense for an unsigned public render route:
        // repeat hits never reach the function at all.
        //
        // Cache keys include the full query string, which is why
        // `lib/compose-params.ts` canonicalizes param order — it's what lets two
        // agents writing the same page different ways share one entry.
        source: "/compose",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=31536000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Served as plain text so an agent fetching the contract reads markdown
        // rather than downloading it.
        source: "/agent.md",
        headers: [
          { key: "Content-Type", value: "text/markdown; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
