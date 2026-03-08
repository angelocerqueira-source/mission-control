import { mutation } from "./_generated/server";

export const clearAll = mutation({
  handler: async (ctx) => {
    const tables = ["tasks", "messages", "activities", "documents", "notifications"] as const;
    const counts: Record<string, number> = {};

    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
      counts[table] = rows.length;
    }

    // Reset all agents to idle, clear lastActiveAt
    const agents = await ctx.db.query("agents").collect();
    for (const agent of agents) {
      await ctx.db.patch(agent._id, {
        status: "idle",
        lastActiveAt: undefined,
        currentTaskId: undefined,
      });
    }
    counts["agents_reset"] = agents.length;

    return counts;
  },
});
