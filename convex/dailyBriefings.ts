import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    date: v.number(),
    productIdeaId: v.optional(v.id("productIdeas")),
    contentRunId: v.optional(v.id("contentRuns")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dailyBriefings", {
      ...args,
      status: "pending",
    });
  },
});

export const markSent = mutation({
  args: {
    id: v.id("dailyBriefings"),
    telegramMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "sent",
      sentAt: Date.now(),
      telegramMessageId: args.telegramMessageId,
    });
  },
});

export const markFailed = mutation({
  args: {
    id: v.id("dailyBriefings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "failed" });
  },
});

export const getToday = query({
  handler: async (ctx) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return await ctx.db
      .query("dailyBriefings")
      .withIndex("by_date", (q) => q.gte("date", todayStart.getTime()))
      .order("desc")
      .first();
  },
});
