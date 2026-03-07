import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    mentionedAgentId: v.id("agents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      mentionedAgentId: args.mentionedAgentId,
      content: args.content,
      delivered: false,
      createdAt: Date.now(),
    });
  },
});

export const getUndelivered = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_undelivered", (q) => q.eq("delivered", false))
      .collect();
  },
});

export const markDelivered = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { delivered: true });
  },
});
