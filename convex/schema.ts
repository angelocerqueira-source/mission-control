import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("blocked")),
    currentTaskId: v.optional(v.id("tasks")),
    sessionKey: v.string(),
    lastActiveAt: v.optional(v.number()),
  }).index("by_sessionKey", ["sessionKey"]),

  projects: defineTable({
    name: v.string(),
    color: v.string(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    assigneeIds: v.array(v.id("agents")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    projectId: v.optional(v.id("projects")),
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_projectId", ["projectId"]),

  messages: defineTable({
    taskId: v.id("tasks"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    attachments: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_taskId", ["taskId"]),

  activities: defineTable({
    type: v.union(
      v.literal("task_created"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("status_changed"),
      v.literal("agent_woke")
    ),
    agentId: v.optional(v.id("agents")),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("deliverable"), v.literal("research"), v.literal("protocol")),
    taskId: v.optional(v.id("tasks")),
    createdAt: v.number(),
  }).index("by_taskId", ["taskId"]),

  tokenUsage: defineTable({
    agentId: v.id("agents"),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
    runs: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    collectedAt: v.number(),
  }).index("by_agent", ["agentId"])
    .index("by_collectedAt", ["collectedAt"]),

  notifications: defineTable({
    mentionedAgentId: v.id("agents"),
    content: v.string(),
    delivered: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_undelivered", ["delivered", "createdAt"])
    .index("by_agent", ["mentionedAgentId"]),

  contentRuns: defineTable({
    tema: v.string(),
    slug: v.string(),
    status: v.union(
      v.literal("researching"),
      v.literal("generating"),
      v.literal("adapting"),
      v.literal("review"),
      v.literal("published"),
      v.literal("failed")
    ),
    mode: v.union(v.literal("fast"), v.literal("deep")),
    sourcesFound: v.optional(v.number()),
    sourcesImported: v.optional(v.number()),
    formats: v.array(v.string()),
    platforms: v.array(v.string()),
    productIdeaId: v.optional(v.id("productIdeas")),
    notebookId: v.optional(v.string()),
    outputDir: v.optional(v.string()),
    timings: v.optional(
      v.object({
        researchMs: v.optional(v.number()),
        generateMs: v.optional(v.number()),
        adaptMs: v.optional(v.number()),
        totalMs: v.optional(v.number()),
      })
    ),
    tokensUsed: v.optional(v.number()),
    error: v.optional(v.string()),
    deliverables: v.optional(v.array(v.object({
      platform: v.string(),
      fileType: v.string(),
      content: v.optional(v.string()),
      filePath: v.optional(v.string()),
      variant: v.optional(v.union(
        v.literal("technical"),
        v.literal("storytelling"),
        v.literal("provocative")
      )),
      chosen: v.optional(v.boolean()),
    }))),
    tokenUsage: v.optional(v.object({
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
      costUsd: v.number(),
    })),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_slug", ["slug"]),

  productIdeas: defineTable({
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
    contentRunId: v.optional(v.id("contentRuns")),
    status: v.union(
      v.literal("new"),
      v.literal("building"),
      v.literal("built"),
      v.literal("skipped")
    ),
    createdAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_status", ["status"]),

  dailyBriefings: defineTable({
    date: v.number(),
    productIdeaId: v.optional(v.id("productIdeas")),
    contentRunId: v.optional(v.id("contentRuns")),
    telegramMessageId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
  })
    .index("by_date", ["date"]),
});
