import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    tema: v.string(),
    slug: v.string(),
    mode: v.union(v.literal("fast"), v.literal("deep")),
    formats: v.array(v.string()),
    platforms: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contentRuns", {
      tema: args.tema,
      slug: args.slug,
      status: "researching",
      mode: args.mode,
      formats: args.formats,
      platforms: args.platforms,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("contentRuns"),
    status: v.optional(v.union(
      v.literal("researching"),
      v.literal("generating"),
      v.literal("adapting"),
      v.literal("review"),
      v.literal("published"),
      v.literal("failed")
    )),
    sourcesFound: v.optional(v.number()),
    sourcesImported: v.optional(v.number()),
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
    }))),
    tokenUsage: v.optional(v.object({
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
      costUsd: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    if (
      args.status === "published" ||
      args.status === "failed"
    ) {
      updates.completedAt = Date.now();
    }
    await ctx.db.patch(id, updates);
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("contentRuns")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contentRuns")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const findSimilar = query({
  args: { tema: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("contentRuns").withIndex("by_createdAt").order("desc").take(100);
    const needle = args.tema.toLowerCase();
    return all.filter((r) => {
      const hay = r.tema.toLowerCase();
      // Check if >50% of words overlap
      const needleWords = new Set(needle.split(/\s+/).filter(w => w.length > 3));
      const hayWords = new Set(hay.split(/\s+/).filter(w => w.length > 3));
      if (needleWords.size === 0) return false;
      let matches = 0;
      for (const w of needleWords) {
        if (hayWords.has(w)) matches++;
      }
      return matches / needleWords.size > 0.5;
    });
  },
});
