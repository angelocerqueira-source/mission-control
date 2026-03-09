import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("deliverable"), v.literal("research"), v.literal("protocol")),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      type: args.type,
      taskId: args.taskId,
      createdAt: Date.now(),
    });
    await ctx.db.insert("activities", {
      type: "document_created",
      message: `Documento criado: ${args.title}`,
      createdAt: Date.now(),
    });
    return docId;
  },
});

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("documents")
      .order("desc")
      .take(50);
  },
});
