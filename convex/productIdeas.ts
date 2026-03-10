import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    date: v.number(),
    name: v.string(),
    problem: v.string(),
    targetAudience: v.string(),
    mvpScope: v.string(),
    suggestedStack: v.string(),
    trendSources: v.array(v.object({
      platform: v.string(),
      url: v.string(),
      title: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("productIdeas", {
      ...args,
      status: "new",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("productIdeas"),
    status: v.union(
      v.literal("new"),
      v.literal("building"),
      v.literal("built"),
      v.literal("skipped")
    ),
    contentRunId: v.optional(v.id("contentRuns")),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

export const getToday = query({
  handler: async (ctx) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return await ctx.db
      .query("productIdeas")
      .withIndex("by_date", (q) => q.gte("date", todayStart.getTime()))
      .order("desc")
      .first();
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("productIdeas")
      .withIndex("by_date")
      .order("desc")
      .take(100);
  },
});
