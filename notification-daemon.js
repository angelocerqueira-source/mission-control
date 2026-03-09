require("dotenv").config({ path: ".env.local" });
const { ConvexHttpClient } = require("convex/browser");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { api } = require("./convex/_generated/api");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set. Add it to .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// --- Config ---
const TELEGRAM_CHAT_ID = "766162535";
const POLL_INTERVAL_MS = 5000; // 5s (was 2s — reduces race conditions)
const TASK_WATCH_INTERVAL_MS = 30000; // 30s — check for done/blocked tasks
const STALE_AGENT_INTERVAL_MS = 300000; // 5min — check for inactive agents
const STALE_THRESHOLD_MS = 3600000; // 1h — agent inactive threshold
const TOKEN_SYNC_INTERVAL_MS = 300000; // 5min — sync token usage from OpenClaw sessions

const OPENCLAW_AGENTS_DIR = "/Users/leticiacampos/.openclaw/agents";

// Map openclaw agent ID → Convex agent ID
const AGENT_CONVEX_MAP = {
  main: "j97cbf1js2vgshsyw0ga3e1ag982f7z9",
  "product-analyst": "j97e3ncpq46rnmgfdr656z2j6s82f9de",
  "customer-researcher": "j97dqrdtvtg7rr1qyzsvhnqpbn82eaeq",
  "seo-analyst": "j9789qbd4g691jqf4yzrbd9e4n82e4c0",
  "content-writer": "j979re80945ghfjebbq15w4rhn82e0w0",
  "social-media-manager": "j979a9yygvknpgcp5rbkexpas182e53t",
  designer: "j972d3pm5ctrygc1dpg57sjzp582fshd",
  "email-marketing": "j971vradzmas2f8p5trkjrvh5h82fc3t",
  developer: "j97eerr3w8c6qqwq6w5psgtpjn82fptb",
  "notion-agent": "j972jbevncx5qtcg1tctdck62s82ff5q",
  babel: "j971vxe1wt459wvres1s20adpd82h8wg",
  banker: "j977hgbfz03tnxeb8h590b7t1h82hebr",
};

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
  babel: "agent:babel:main",
  banker: "agent:banker:main",
};

// --- State tracking (in-memory) ---
const deliveredNotificationIds = new Set();
const notifiedTaskStatuses = new Map(); // taskId -> last notified status
const notifiedStaleAgents = new Set(); // agentId -> already warned

// --- Helpers ---

function sendTelegram(message) {
  try {
    const cmd = `openclaw message send --channel telegram --target ${TELEGRAM_CHAT_ID} --message ${JSON.stringify(message)}`;
    execSync(cmd, { timeout: 15000 });
    console.log(`[TELEGRAM] Sent: ${message.slice(0, 80)}...`);
  } catch (err) {
    console.error(`[TELEGRAM ERROR] ${err.message}`);
  }
}

function resolveAgentCliId(agent) {
  return (
    Object.entries(AGENT_SESSION_MAP).find(
      ([, sessionKey]) => sessionKey === agent.sessionKey
    )?.[0] || agent.sessionKey.split(":")[1]
  );
}

async function getTaskContextForAgent(agentId) {
  try {
    const allTasks = await client.query(api.tasks.list);
    const agentTasks = allTasks.filter(
      (t) =>
        t.assigneeIds.includes(agentId) &&
        (t.status === "assigned" || t.status === "in_progress")
    );
    if (agentTasks.length === 0) return "";
    const taskLines = agentTasks.map(
      (t) => `  - [${t.status}] ${t.title} (ID: ${t._id})`
    );
    return `\n\n---\n[Mission Control Context] Voce tem ${agentTasks.length} task(s) pendente(s):\n${taskLines.join("\n")}\nAntes de criar tasks novas, verifique se alguma dessas ja cobre o pedido.`;
  } catch (err) {
    console.log("[WARN] Could not fetch task context:", err.message);
    return "";
  }
}

// --- Feature 1: Deliver @mention notifications to agents (with dedup) ---

async function deliverNotifications() {
  try {
    const notifications = await client.query(api.notifications.getUndelivered);

    for (const notif of notifications) {
      // Dedup: skip if we already delivered this one in this daemon session
      if (deliveredNotificationIds.has(notif._id)) continue;
      // Mark immediately to prevent race condition on next poll
      deliveredNotificationIds.add(notif._id);

      const agents = await client.query(api.agents.list);
      const agent = agents.find((a) => a._id === notif.mentionedAgentId);

      if (!agent) {
        console.log(`[WARN] Agent not found for notification ${notif._id}`);
        continue;
      }

      const agentCliId = resolveAgentCliId(agent);

      try {
        const taskContext = await getTaskContextForAgent(agent._id);
        const enrichedContent = notif.content + taskContext;

        const cmd = `openclaw agent --agent "${agentCliId}" --message ${JSON.stringify(enrichedContent)}`;
        console.log(
          `[DELIVER] -> ${agent.name} (${agentCliId}): ${notif.content.slice(0, 80)}...`
        );
        if (taskContext) {
          console.log(
            `[CONTEXT] Enriched with ${taskContext.split("\n").length - 3} task(s)`
          );
        }
        execSync(cmd, { timeout: 120000 });

        await client.mutation(api.notifications.markDelivered, {
          id: notif._id,
        });
        console.log(
          `[OK] Notification ${notif._id} delivered to ${agent.name}`
        );
      } catch (err) {
        // Remove from dedup set so we retry next cycle
        deliveredNotificationIds.delete(notif._id);
        console.log(
          `[QUEUE] ${agent.name} may be sleeping — notification stays queued`
        );
      }
    }
  } catch (err) {
    console.error("[ERROR] Notification poll failed:", err.message);
  }
}

// --- Feature 2: Task watcher — notify founder on done/blocked ---

async function watchTaskStatuses() {
  try {
    const allTasks = await client.query(api.tasks.list);
    const agents = await client.query(api.agents.list);

    for (const task of allTasks) {
      const lastStatus = notifiedTaskStatuses.get(task._id);

      // First run: seed current state without notifying
      if (lastStatus === undefined) {
        notifiedTaskStatuses.set(task._id, task.status);
        continue;
      }

      // Status changed since last check
      if (lastStatus !== task.status) {
        notifiedTaskStatuses.set(task._id, task.status);

        if (task.status === "done") {
          const assigneeNames = task.assigneeIds
            .map((id) => agents.find((a) => a._id === id)?.name || "?")
            .join(", ");
          sendTelegram(
            `✅ Task concluída: "${task.title}"\nAgente(s): ${assigneeNames}\nID: ${task._id}`
          );
        }

        if (task.status === "blocked") {
          const assigneeNames = task.assigneeIds
            .map((id) => agents.find((a) => a._id === id)?.name || "?")
            .join(", ");
          sendTelegram(
            `🔴 Task bloqueada: "${task.title}"\nAgente(s): ${assigneeNames}\nID: ${task._id}\nAção necessária.`
          );
        }
      }
    }
  } catch (err) {
    console.error("[ERROR] Task watch failed:", err.message);
  }
}

// --- Feature 3: Stale agent detector ---

async function checkStaleAgents() {
  try {
    const allTasks = await client.query(api.tasks.list);
    const agents = await client.query(api.agents.list);
    const now = Date.now();

    // Find agents with in_progress tasks
    const busyAgentIds = new Set();
    for (const task of allTasks) {
      if (task.status === "in_progress") {
        for (const id of task.assigneeIds) {
          busyAgentIds.add(id);
        }
      }
    }

    for (const agent of agents) {
      if (!busyAgentIds.has(agent._id)) continue;
      if (!agent.lastActiveAt) continue;

      const inactiveMs = now - agent.lastActiveAt;
      if (inactiveMs > STALE_THRESHOLD_MS) {
        // Only warn once per stale episode
        if (notifiedStaleAgents.has(agent._id)) continue;
        notifiedStaleAgents.add(agent._id);

        const inactiveMin = Math.round(inactiveMs / 60000);
        const taskTitles = allTasks
          .filter(
            (t) =>
              t.status === "in_progress" && t.assigneeIds.includes(agent._id)
          )
          .map((t) => t.title)
          .join(", ");

        sendTelegram(
          `⚠️ Agente inativo: ${agent.name} (${inactiveMin}min sem heartbeat)\nTasks em andamento: ${taskTitles}\nPossível sessão morta.`
        );
      } else {
        // Agent is active again — reset stale flag
        notifiedStaleAgents.delete(agent._id);
      }
    }
  } catch (err) {
    console.error("[ERROR] Stale agent check failed:", err.message);
  }
}

// --- Feature 4: Token usage sync from OpenClaw sessions ---

async function syncTokenUsage() {
  try {
    const now = Date.now();
    let synced = 0;

    for (const [agentCliId, convexId] of Object.entries(AGENT_CONVEX_MAP)) {
      const sessionFile = path.join(
        OPENCLAW_AGENTS_DIR,
        agentCliId,
        "sessions",
        "sessions.json"
      );

      if (!fs.existsSync(sessionFile)) continue;

      let data;
      try {
        data = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
      } catch {
        continue;
      }

      let totalIn = 0;
      let totalOut = 0;
      let totalTok = 0;
      let runs = 0;
      let earliest = now;
      let latest = 0;

      for (const [, session] of Object.entries(data)) {
        if (
          typeof session !== "object" ||
          session === null ||
          !("inputTokens" in session)
        )
          continue;
        totalIn += session.inputTokens || 0;
        totalOut += session.outputTokens || 0;
        totalTok += session.totalTokens || 0;
        runs++;
        const updated = session.updatedAt || 0;
        if (typeof updated === "number" && updated > 0) {
          const ts = updated < 1e12 ? updated * 1000 : updated;
          earliest = Math.min(earliest, ts);
          latest = Math.max(latest, ts);
        }
      }

      if (runs === 0) continue;

      await client.mutation(api.tokenUsage.record, {
        agentId: convexId,
        inputTokens: totalIn,
        outputTokens: totalOut,
        totalTokens: totalTok,
        runs,
        periodStart: earliest < now ? earliest : now,
        periodEnd: latest > 0 ? latest : now,
      });
      synced++;
    }

    console.log(`[TOKENS] Synced ${synced} agents`);
  } catch (err) {
    console.error("[ERROR] Token sync failed:", err.message);
  }
}

// --- Start ---

console.log("[START] Notification daemon running...");
console.log(`[CONFIG] Notification poll: ${POLL_INTERVAL_MS}ms`);
console.log(`[CONFIG] Task watcher: ${TASK_WATCH_INTERVAL_MS}ms`);
console.log(`[CONFIG] Stale agent check: ${STALE_AGENT_INTERVAL_MS}ms`);
console.log(`[CONFIG] Token sync: ${TOKEN_SYNC_INTERVAL_MS}ms`);
console.log(`[CONFIG] Telegram target: ${TELEGRAM_CHAT_ID}`);
console.log(`[CONFIG] Convex URL: ${CONVEX_URL}`);

// Seed task statuses on first run (no notifications for existing state)
watchTaskStatuses().then(() => {
  console.log("[INIT] Task statuses seeded");
});

// Initial token sync
syncTokenUsage().then(() => {
  console.log("[INIT] Token usage synced");
});

setInterval(deliverNotifications, POLL_INTERVAL_MS);
setInterval(watchTaskStatuses, TASK_WATCH_INTERVAL_MS);
setInterval(checkStaleAgents, STALE_AGENT_INTERVAL_MS);
setInterval(syncTokenUsage, TOKEN_SYNC_INTERVAL_MS);
