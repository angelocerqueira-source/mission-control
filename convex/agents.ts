import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    sessionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const agentId = await ctx.db.insert("agents", {
      name: args.name,
      role: args.role,
      status: "idle",
      sessionKey: args.sessionKey,
    });
    await ctx.db.insert("activities", {
      type: "agent_woke",
      agentId,
      message: `${args.name} registrado como ${args.role}`,
      createdAt: Date.now(),
    });
    return agentId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("blocked")),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      currentTaskId: args.currentTaskId,
    });
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const getBySessionKey = query({
  args: { sessionKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_sessionKey", (q) => q.eq("sessionKey", args.sessionKey))
      .first();
  },
});
