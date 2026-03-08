import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const record = mutation({
  args: {
    agentId: v.id("agents"),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
    runs: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tokenUsage", {
      ...args,
      collectedAt: Date.now(),
    });
  },
});

export const getLatestByAgent = query({
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const result: Record<
      string,
      {
        agentId: string;
        agentName: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        runs: number;
        collectedAt: number;
      }
    > = {};

    for (const agent of agents) {
      const latest = await ctx.db
        .query("tokenUsage")
        .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
        .order("desc")
        .first();

      if (latest) {
        result[agent._id] = {
          agentId: agent._id,
          agentName: agent.name,
          inputTokens: latest.inputTokens,
          outputTokens: latest.outputTokens,
          totalTokens: latest.totalTokens,
          runs: latest.runs,
          collectedAt: latest.collectedAt,
        };
      }
    }

    return result;
  },
});

export const getTotals = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("tokenUsage").order("desc").take(100);

    // Get latest per agent
    const latestByAgent: Record<string, (typeof all)[0]> = {};
    for (const entry of all) {
      const key = entry.agentId;
      if (!latestByAgent[key]) {
        latestByAgent[key] = entry;
      }
    }

    const entries = Object.values(latestByAgent);
    const totalInput = entries.reduce((s, e) => s + e.inputTokens, 0);
    const totalOutput = entries.reduce((s, e) => s + e.outputTokens, 0);
    const totalTokens = entries.reduce((s, e) => s + e.totalTokens, 0);
    const totalRuns = entries.reduce((s, e) => s + e.runs, 0);

    return {
      totalInput,
      totalOutput,
      totalTokens,
      totalRuns,
      agentCount: entries.length,
    };
  },
});
