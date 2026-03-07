import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      taskId: args.taskId,
      fromAgentId: args.fromAgentId,
      content: args.content,
      attachments: args.attachments ?? [],
      createdAt: Date.now(),
    });

    await ctx.db.insert("activities", {
      type: "message_sent",
      agentId: args.fromAgentId,
      message: `Comentario em tarefa`,
      createdAt: Date.now(),
    });

    // Detect @mentions and create notifications
    const mentionPattern = /@(\w[\w-]*)/g;
    let match;
    while ((match = mentionPattern.exec(args.content)) !== null) {
      const mentionedName = match[1];
      const agents = await ctx.db.query("agents").collect();
      const mentioned = agents.find(
        (a) => a.name.toLowerCase() === mentionedName.toLowerCase()
      );
      if (mentioned) {
        await ctx.db.insert("notifications", {
          mentionedAgentId: mentioned._id,
          content: args.content,
          delivered: false,
          createdAt: Date.now(),
        });
      }
    }

    return messageId;
  },
});

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});
