import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const log = mutation({
  args: {
    type: v.union(
      v.literal("task_created"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("status_changed"),
      v.literal("agent_woke")
    ),
    agentId: v.optional(v.id("agents")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      type: args.type,
      agentId: args.agentId,
      message: args.message,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});
