#!/usr/bin/env node
/**
 * Token Usage Collector
 * Reads cron run history from OpenClaw and records token usage per agent in Convex.
 * Run: node collect-tokens.js
 */

require("dotenv").config({ path: ".env.local" });
const { ConvexHttpClient } = require("convex/browser");
const { execSync } = require("child_process");
const { api } = require("./convex/_generated/api");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Map cron names to agent session keys
const CRON_AGENT_MAP = {
  "shuri-heartbeat": "agent:product-analyst:main",
  "fury-heartbeat": "agent:customer-researcher:main",
  "vision-heartbeat": "agent:seo-analyst:main",
  "loki-heartbeat": "agent:content-writer:main",
  "quill-heartbeat": "agent:social-media-manager:main",
  "wanda-heartbeat": "agent:designer:main",
  "pepper-heartbeat": "agent:email-marketing:main",
  "friday-heartbeat": "agent:developer:main",
  "wong-heartbeat": "agent:notion-agent:main",
  "babel-heartbeat": "agent:babel:main",
  "banker-heartbeat": "agent:banker:main",
  "daily-standup": "agent:main:main",
};

async function collectTokens() {
  console.log("[COLLECT] Starting token usage collection...");

  // Get all crons
  let cronList;
  try {
    const raw = execSync("openclaw cron list --json 2>/dev/null", {
      timeout: 15000,
    }).toString();
    cronList = JSON.parse(raw);
  } catch {
    // Fallback: parse from non-json output
    console.log("[COLLECT] JSON output not available, using run data per cron");
    cronList = null;
  }

  // Get agents from Convex
  const agents = await client.query(api.agents.list);
  const agentBySession = {};
  for (const a of agents) {
    agentBySession[a.sessionKey] = a;
  }

  // Known cron IDs — get from `openclaw cron list`
  const cronIds = getCronIds();

  for (const [cronName, cronId] of Object.entries(cronIds)) {
    const sessionKey = CRON_AGENT_MAP[cronName];
    const agent = agentBySession[sessionKey];

    if (!agent) {
      console.log(`[SKIP] No agent found for ${cronName} (${sessionKey})`);
      continue;
    }

    try {
      const raw = execSync(
        `openclaw cron runs --id ${cronId} --limit 50 2>&1`,
        { timeout: 30000 }
      ).toString();

      // Extract JSON object from output (skip doctor warnings)
      const jsonStart = raw.indexOf("{");
      if (jsonStart === -1) {
        console.log(`[SKIP] No JSON in output for ${cronName}`);
        continue;
      }

      let data;
      try {
        data = JSON.parse(raw.slice(jsonStart));
      } catch {
        console.log(`[SKIP] Could not parse runs for ${cronName}`);
        continue;
      }

      const entries = data.entries || [];
      if (entries.length === 0) {
        console.log(`[SKIP] No runs for ${cronName}`);
        continue;
      }

      let totalInput = 0;
      let totalOutput = 0;
      let totalTokens = 0;
      let runs = 0;
      let minTs = Infinity;
      let maxTs = 0;

      for (const entry of entries) {
        if (entry.usage) {
          totalInput += entry.usage.input_tokens || 0;
          totalOutput += entry.usage.output_tokens || 0;
          totalTokens += entry.usage.total_tokens || 0;
          runs++;
          const ts = entry.runAtMs || entry.ts || 0;
          if (ts < minTs) minTs = ts;
          if (ts > maxTs) maxTs = ts;
        }
      }

      if (runs === 0) {
        console.log(`[SKIP] No usage data for ${cronName}`);
        continue;
      }

      await client.mutation(api.tokenUsage.record, {
        agentId: agent._id,
        inputTokens: totalInput,
        outputTokens: totalOutput,
        totalTokens: totalTokens,
        runs,
        periodStart: minTs,
        periodEnd: maxTs,
      });

      console.log(
        `[OK] ${agent.name}: ${totalTokens.toLocaleString()} tokens across ${runs} runs`
      );
    } catch (err) {
      console.log(`[ERROR] ${cronName}: ${err.message}`);
    }
  }

  console.log("[DONE] Token collection complete.");
}

function getCronIds() {
  // Parse cron list to get IDs
  try {
    const raw = execSync("openclaw cron list 2>/dev/null", {
      timeout: 15000,
    }).toString();

    const ids = {};
    const lines = raw.split("\n");
    for (const line of lines) {
      // Match UUID followed by cron name
      const match = line.match(
        /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+(\S+-heartbeat|daily-standup)/
      );
      if (match) {
        ids[match[2]] = match[1];
      }
    }
    return ids;
  } catch (err) {
    console.error("[ERROR] Could not list crons:", err.message);
    return {};
  }
}

collectTokens().catch(console.error);
