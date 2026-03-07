require("dotenv").config({ path: ".env.local" });
const { ConvexHttpClient } = require("convex/browser");
const { execSync } = require("child_process");
const { api } = require("./convex/_generated/api");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set. Add it to .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

const AGENT_SESSION_MAP = {
  main: "agent:main:main",
  "product-analyst": "agent:product-analyst:main",
  "customer-researcher": "agent:customer-researcher:main",
  "seo-analyst": "agent:seo-analyst:main",
  "content-writer": "agent:content-writer:main",
  "social-media-manager": "agent:social-media-manager:main",
  designer: "agent:designer:main",
  "email-marketing": "agent:email-marketing:main",
  developer: "agent:developer:main",
  "notion-agent": "agent:notion-agent:main",
};

const POLL_INTERVAL_MS = 2000;

async function deliverNotifications() {
  try {
    const notifications = await client.query(api.notifications.getUndelivered);

    for (const notif of notifications) {
      const agents = await client.query(api.agents.list);
      const agent = agents.find((a) => a._id === notif.mentionedAgentId);

      if (!agent) {
        console.log(`[WARN] Agent not found for notification ${notif._id}`);
        continue;
      }

      // Find agent ID by matching session key pattern
      const agentEntry = Object.entries(AGENT_SESSION_MAP).find(
        ([, sessionKey]) => sessionKey === agent.sessionKey
      );

      const sessionKey = agentEntry
        ? AGENT_SESSION_MAP[agentEntry[0]]
        : agent.sessionKey;

      try {
        const cmd = `openclaw sessions send --session "${sessionKey}" --message ${JSON.stringify(notif.content)}`;
        console.log(`[DELIVER] -> ${agent.name}: ${notif.content.slice(0, 80)}...`);
        execSync(cmd, { timeout: 15000 });

        await client.mutation(api.notifications.markDelivered, {
          id: notif._id,
        });
        console.log(`[OK] Notification ${notif._id} delivered to ${agent.name}`);
      } catch (err) {
        console.log(
          `[QUEUE] ${agent.name} may be sleeping — notification stays queued`
        );
      }
    }
  } catch (err) {
    console.error("[ERROR] Poll failed:", err.message);
  }
}

console.log("[START] Notification daemon running...");
console.log(`[CONFIG] Polling every ${POLL_INTERVAL_MS}ms`);
console.log(`[CONFIG] Convex URL: ${CONVEX_URL}`);

setInterval(deliverNotifications, POLL_INTERVAL_MS);
