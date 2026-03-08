#!/usr/bin/env node
/**
 * Heartbeat Daemon — Zero tokens
 * Calls agents:heartbeat for all 12 agents every 15 minutes via Convex HTTP.
 * No LLM involved. Just updates status + lastActiveAt in the database.
 */

require("dotenv").config({ path: ".env.local" });
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("./convex/_generated/api");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

const SESSION_KEYS = [
  "agent:main:main",
  "agent:product-analyst:main",
  "agent:customer-researcher:main",
  "agent:seo-analyst:main",
  "agent:content-writer:main",
  "agent:social-media-manager:main",
  "agent:designer:main",
  "agent:email-marketing:main",
  "agent:developer:main",
  "agent:notion-agent:main",
  "agent:babel:main",
  "agent:banker:main",
];

const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

async function heartbeatAll() {
  const timestamp = new Date().toLocaleTimeString("pt-BR");
  let ok = 0;
  let fail = 0;

  for (const sessionKey of SESSION_KEYS) {
    try {
      await client.mutation(api.agents.heartbeat, { sessionKey });
      ok++;
    } catch {
      fail++;
    }
  }

  console.log(`[${timestamp}] Heartbeat: ${ok} ok, ${fail} fail`);
}

console.log("[START] Heartbeat daemon — zero tokens");
console.log(`[CONFIG] ${SESSION_KEYS.length} agents, every ${INTERVAL_MS / 60000}min`);

// Run immediately, then on interval
heartbeatAll();
setInterval(heartbeatAll, INTERVAL_MS);
