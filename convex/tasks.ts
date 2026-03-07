import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: "inbox",
      assigneeIds: [],
      priority: args.priority,
      createdAt: Date.now(),
    });
    await ctx.db.insert("activities", {
      type: "task_created",
      message: `Tarefa criada: ${args.title}`,
      createdAt: Date.now(),
    });
    return taskId;
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("assigned"),
        v.literal("in_progress"),
        v.literal("review"),
        v.literal("done"),
        v.literal("blocked")
      )
    ),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
    if (args.status) {
      await ctx.db.insert("activities", {
        type: "status_changed",
        message: `Tarefa atualizada para ${args.status}`,
        createdAt: Date.now(),
      });
    }
  },
});

export const assign = mutation({
  args: {
    id: v.id("tasks"),
    assigneeIds: v.array(v.id("agents")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      assigneeIds: args.assigneeIds,
      status: "assigned",
    });
    await ctx.db.insert("activities", {
      type: "status_changed",
      message: `Tarefa atribuida a ${args.assigneeIds.length} agente(s)`,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const getByStatus = query({
  args: {
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});
