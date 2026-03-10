"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type Tab = "pipeline" | "history" | "metrics";

const TABS: { id: Tab; label: string; shortcut: string }[] = [
  { id: "pipeline", label: "Pipeline", shortcut: "1" },
  { id: "history", label: "Historico", shortcut: "2" },
  { id: "metrics", label: "Metricas", shortcut: "3" },
];

type Deliverable = {
  platform: string;
  fileType: string;
  content?: string;
  filePath?: string;
};

type TokenUsageDetail = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
};

type ContentRun = {
  _id: string;
  tema: string;
  slug: string;
  status: "researching" | "generating" | "adapting" | "review" | "published" | "failed";
  mode: "fast" | "deep";
  sourcesFound?: number;
  sourcesImported?: number;
  formats: string[];
  platforms: string[];
  notebookId?: string;
  outputDir?: string;
  timings?: {
    researchMs?: number;
    generateMs?: number;
    adaptMs?: number;
    totalMs?: number;
  };
  tokensUsed?: number;
  error?: string;
  deliverables?: Deliverable[];
  tokenUsage?: TokenUsageDetail;
  createdAt: number;
  completedAt?: number;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  researching: {
    label: "Pesquisando",
    color: "text-signal-blue",
    bg: "bg-signal-blue/10",
    border: "border-signal-blue/30",
    icon: "◎",
  },
  generating: {
    label: "Gerando",
    color: "text-signal-amber",
    bg: "bg-signal-amber/10",
    border: "border-signal-amber/30",
    icon: "◉",
  },
  adapting: {
    label: "Adaptando",
    color: "text-signal-purple",
    bg: "bg-signal-purple/10",
    border: "border-signal-purple/30",
    icon: "◈",
  },
  review: {
    label: "Review",
    color: "text-amber-glow",
    bg: "bg-amber-glow/10",
    border: "border-amber-glow/30",
    icon: "◇",
  },
  published: {
    label: "Publicado",
    color: "text-signal-green",
    bg: "bg-signal-green/10",
    border: "border-signal-green/30",
    icon: "●",
  },
  failed: {
    label: "Falhou",
    color: "text-signal-red",
    bg: "bg-signal-red/10",
    border: "border-signal-red/30",
    icon: "✕",
  },
};

const PIPELINE_STAGES = [
  "researching",
  "generating",
  "adapting",
  "review",
  "published",
] as const;

const PLATFORM_LABELS: Record<string, { short: string; color: string }> = {
  youtube: { short: "YT", color: "text-signal-red" },
  linkedin: { short: "LI", color: "text-signal-blue" },
  instagram: { short: "IG", color: "text-signal-purple" },
  tiktok: { short: "TK", color: "text-ink-300" },
};

export default function ContentStudio() {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const contentRuns = useQuery(api.contentRuns.list);

  return (
    <div className="min-h-screen min-h-dvh flex flex-col">
      {/* Header */}
      <header className="border-b border-ink-800/60 bg-ink-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href="/"
              className="text-ink-600 hover:text-ink-400 transition-colors text-sm font-mono"
              title="Voltar"
            >
              ←
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 min-w-0">
              <h1 className="font-[family-name:var(--font-display)] text-lg sm:text-2xl font-bold text-ink-50 tracking-tight truncate">
                Content Studio
              </h1>
              <span className="text-signal-purple text-[10px] sm:text-xs font-mono tracking-widest uppercase hidden sm:inline">
                Editorial Pipeline
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            <time className="text-ink-500 text-[10px] sm:text-xs font-mono hidden md:block">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </time>
            {contentRuns && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-mono text-ink-500">
                  {contentRuns.length} runs
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-3 sm:mt-4">
          <div className="flex items-end gap-0 -mb-px overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-3 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-mono tracking-wider uppercase
                    transition-colors duration-200 whitespace-nowrap cursor-pointer
                    border-b-2 -mb-[2px]
                    ${
                      isActive
                        ? "text-signal-purple border-signal-purple"
                        : "text-ink-500 border-transparent hover:text-ink-300 hover:border-ink-700"
                    }
                  `}
                >
                  <span className="hidden sm:inline text-ink-600 mr-1.5 text-[10px]">
                    {tab.shortcut}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === "pipeline" && (
            <PipelineView runs={contentRuns ?? []} />
          )}
          {activeTab === "history" && (
            <HistoryView runs={contentRuns ?? []} />
          )}
          {activeTab === "metrics" && (
            <MetricsView runs={contentRuns ?? []} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-800/30 py-4 sm:py-6 safe-bottom mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-mono text-ink-600">
            content-studio v0.1.0
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-ink-600">
            4 plataformas · 6 vozes
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ── Pipeline View ── */

function PipelineView({ runs }: { runs: ContentRun[] }) {
  const activeRuns = runs.filter(
    (r) => r.status !== "published" && r.status !== "failed"
  );
  const recentPublished = runs
    .filter((r) => r.status === "published")
    .slice(0, 3);

  const runsByStage: Record<string, ContentRun[]> = {};
  for (const stage of PIPELINE_STAGES) {
    runsByStage[stage] = runs.filter((r) => r.status === stage);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stage summary bar */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const config = STATUS_CONFIG[stage];
          const count = runsByStage[stage].length;
          return (
            <div
              key={stage}
              className={`rounded-lg border ${config.border} ${config.bg} p-3 sm:p-4 text-center`}
            >
              <p className="text-lg sm:text-2xl font-[family-name:var(--font-display)] font-bold mb-0.5">
                <span className={config.color}>{count}</span>
              </p>
              <p className="text-[9px] sm:text-[10px] font-mono text-ink-500 tracking-wider uppercase">
                {config.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active runs */}
      {activeRuns.length > 0 ? (
        <div>
          <SectionLabel text="Em andamento" />
          <div className="space-y-3">
            {activeRuns.map((run, i) => (
              <RunCard key={run._id} run={run} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-8 sm:p-12 text-center">
          <p className="text-ink-600 font-mono text-sm mb-2">
            Nenhum pipeline ativo
          </p>
          <p className="text-ink-700 font-mono text-xs">
            Use <span className="text-signal-purple">/conteudo [tema]</span> no
            Telegram para iniciar
          </p>
        </div>
      )}

      {/* Recent published */}
      {recentPublished.length > 0 && (
        <div>
          <SectionLabel text="Publicados recentes" />
          <div className="space-y-2">
            {recentPublished.map((run, i) => (
              <RunCard key={run._id} run={run} index={i} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── History View ── */

function HistoryView({ runs }: { runs: ContentRun[] }) {
  const grouped = groupByMonth(runs);

  if (runs.length === 0) {
    return (
      <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-8 sm:p-12 text-center">
        <p className="text-ink-600 font-mono text-sm mb-2">
          Nenhum conteudo gerado ainda
        </p>
        <p className="text-ink-700 font-mono text-xs">
          O historico aparece aqui conforme voce gera conteudo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([month, monthRuns]) => (
        <div key={month}>
          <SectionLabel text={month} />
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-ink-800/60" />
            <div className="space-y-1">
              {monthRuns.map((run) => {
                const config = STATUS_CONFIG[run.status];
                return (
                  <div
                    key={run._id}
                    className="flex items-start gap-4 py-2.5 px-1 group hover:bg-ink-900/30 rounded-lg transition-colors"
                  >
                    {/* Timeline dot */}
                    <span className={`relative z-10 mt-1.5 text-xs ${config.color} flex-shrink-0`}>
                      {config.icon}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-200 truncate group-hover:text-ink-100 transition-colors">
                        {run.tema}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] font-mono ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] font-mono text-ink-600">
                          {run.mode}
                        </span>
                        {/* Platform pills */}
                        <div className="flex gap-1">
                          {run.platforms.map((p) => {
                            const pl = PLATFORM_LABELS[p];
                            return pl ? (
                              <span
                                key={p}
                                className={`text-[9px] font-mono ${pl.color} opacity-60`}
                              >
                                {pl.short}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <time className="text-[10px] font-mono text-ink-600 flex-shrink-0 mt-0.5">
                      {new Date(run.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </time>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Metrics View ── */

function MetricsView({ runs }: { runs: ContentRun[] }) {
  const completed = runs.filter((r) => r.completedAt);
  const withTimings = completed.filter((r) => r.timings?.totalMs);
  const totalTokens = completed.reduce((sum, r) => sum + (r.tokensUsed ?? 0), 0);
  const totalCost = completed.reduce((sum, r) => sum + (r.tokenUsage?.costUsd ?? 0), 0);
  const withTokenUsage = completed.filter((r) => r.tokenUsage);

  const avgTotal =
    withTimings.length > 0
      ? withTimings.reduce((sum, r) => sum + (r.timings?.totalMs ?? 0), 0) /
        withTimings.length
      : 0;

  const avgResearch =
    withTimings.length > 0
      ? withTimings.reduce((sum, r) => sum + (r.timings?.researchMs ?? 0), 0) /
        withTimings.length
      : 0;

  const avgGenerate =
    withTimings.length > 0
      ? withTimings.reduce((sum, r) => sum + (r.timings?.generateMs ?? 0), 0) /
        withTimings.length
      : 0;

  const avgAdapt =
    withTimings.length > 0
      ? withTimings.reduce((sum, r) => sum + (r.timings?.adaptMs ?? 0), 0) /
        withTimings.length
      : 0;

  // Platform distribution
  const platformCounts: Record<string, number> = {};
  for (const run of completed) {
    for (const p of run.platforms) {
      platformCounts[p] = (platformCounts[p] ?? 0) + 1;
    }
  }

  // Format distribution
  const formatCounts: Record<string, number> = {};
  for (const run of completed) {
    for (const f of run.formats) {
      formatCounts[f] = (formatCounts[f] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          label="Total Runs"
          value={`${completed.length}`}
          accent="purple"
        />
        <MetricCard
          label="Tempo Medio"
          value={avgTotal > 0 ? formatMs(avgTotal) : "—"}
          accent="amber"
        />
        <MetricCard
          label="Tokens Gastos"
          value={totalTokens > 0 ? formatTokens(totalTokens) : "—"}
          accent="blue"
        />
        <MetricCard
          label="Custo OpenAI"
          value={totalCost > 0 ? `$${totalCost.toFixed(4)}` : "—"}
          accent="amber"
          subtitle={withTokenUsage.length > 0 ? `$${(totalCost / withTokenUsage.length).toFixed(4)}/run` : undefined}
        />
        <MetricCard
          label="Publicados"
          value={`${runs.filter((r) => r.status === "published").length}`}
          accent="green"
        />
      </div>

      {/* Timing breakdown */}
      {withTimings.length > 0 && (
        <div>
          <SectionLabel text="Tempo medio por step" />
          <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-4 sm:p-5 space-y-3">
            <TimingBar
              label="Research"
              ms={avgResearch}
              maxMs={avgTotal}
              color="bg-signal-blue"
            />
            <TimingBar
              label="Generate"
              ms={avgGenerate}
              maxMs={avgTotal}
              color="bg-signal-amber"
            />
            <TimingBar
              label="Adapt"
              ms={avgAdapt}
              maxMs={avgTotal}
              color="bg-signal-purple"
            />
          </div>
        </div>
      )}

      {/* Token cost per run */}
      {withTokenUsage.length > 0 && (
        <div>
          <SectionLabel text="Custo por run" />
          <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-4 sm:p-5">
            <div className="space-y-2">
              {withTokenUsage.slice(0, 10).map((run) => (
                <div key={run._id} className="flex items-center gap-3">
                  <span className="text-[11px] text-ink-400 truncate flex-1 min-w-0">
                    {run.tema}
                  </span>
                  <span className="text-[10px] font-mono text-ink-600 flex-shrink-0">
                    {formatTokens(run.tokenUsage!.promptTokens)}in
                  </span>
                  <span className="text-[10px] font-mono text-ink-600 flex-shrink-0">
                    {formatTokens(run.tokenUsage!.completionTokens)}out
                  </span>
                  <span className="text-[10px] font-mono text-amber-glow flex-shrink-0 w-16 text-right">
                    ${run.tokenUsage!.costUsd.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Distributions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* By platform */}
        <div>
          <SectionLabel text="Por plataforma" />
          <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-4 sm:p-5">
            {Object.keys(platformCounts).length > 0 ? (
              <div className="space-y-2.5">
                {Object.entries(platformCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([platform, count]) => {
                    const pl = PLATFORM_LABELS[platform];
                    const maxCount = Math.max(
                      ...Object.values(platformCounts)
                    );
                    return (
                      <div key={platform} className="flex items-center gap-3">
                        <span
                          className={`text-xs font-mono w-8 flex-shrink-0 ${pl?.color ?? "text-ink-400"}`}
                        >
                          {pl?.short ?? platform}
                        </span>
                        <div className="flex-1 h-2 bg-ink-800/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-signal-purple rounded-full transition-all duration-500"
                            style={{
                              width: `${(count / maxCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-ink-500 w-6 text-right flex-shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs font-mono text-ink-600">
                Sem dados ainda
              </p>
            )}
          </div>
        </div>

        {/* By format */}
        <div>
          <SectionLabel text="Por formato" />
          <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-4 sm:p-5">
            {Object.keys(formatCounts).length > 0 ? (
              <div className="space-y-2.5">
                {Object.entries(formatCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([format, count]) => {
                    const maxCount = Math.max(
                      ...Object.values(formatCounts)
                    );
                    return (
                      <div key={format} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-ink-400 w-20 flex-shrink-0 truncate">
                          {format}
                        </span>
                        <div className="flex-1 h-2 bg-ink-800/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-glow rounded-full transition-all duration-500"
                            style={{
                              width: `${(count / maxCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-ink-500 w-6 text-right flex-shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs font-mono text-ink-600">
                Sem dados ainda
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {completed.length === 0 && (
        <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-8 sm:p-12 text-center">
          <p className="text-ink-600 font-mono text-sm mb-2">
            Metricas aparecem apos a primeira run completa
          </p>
          <p className="text-ink-700 font-mono text-xs">
            Tempos, tokens e distribuicao por plataforma/formato
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Shared Components ── */

function RunCard({
  run,
  index,
  compact,
}: {
  run: ContentRun;
  index: number;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[run.status];
  const isActive =
    run.status === "researching" ||
    run.status === "generating" ||
    run.status === "adapting";
  const hasDeliverables = run.deliverables && run.deliverables.length > 0;

  // Progress through stages
  const stageIndex = PIPELINE_STAGES.indexOf(
    run.status as (typeof PIPELINE_STAGES)[number]
  );

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 py-2 px-3 rounded-lg bg-ink-900/40 border border-ink-800/40 hover:border-ink-800/80 transition-colors cursor-pointer"
        style={{ animationDelay: `${index * 40}ms` }}
        onClick={() => hasDeliverables && setExpanded(!expanded)}
      >
        <span className={`text-xs ${config.color} flex-shrink-0`}>
          {config.icon}
        </span>
        <span className="text-sm text-ink-300 truncate flex-1">{run.tema}</span>
        <div className="flex gap-1.5 flex-shrink-0">
          {run.platforms.map((p) => {
            const pl = PLATFORM_LABELS[p];
            return pl ? (
              <span
                key={p}
                className={`text-[9px] font-mono ${pl.color} opacity-50`}
              >
                {pl.short}
              </span>
            ) : null;
          })}
        </div>
        {hasDeliverables && (
          <span className={`text-[10px] text-ink-600 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}>
            ▸
          </span>
        )}
        <time className="text-[10px] font-mono text-ink-600 flex-shrink-0">
          {new Date(run.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })}
        </time>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} p-4 sm:p-5 animate-fade-in`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-[family-name:var(--font-display)] font-semibold text-ink-100 truncate">
            {run.tema}
          </h3>
          <p className="text-[10px] font-mono text-ink-600 mt-0.5">
            {run.slug} · modo {run.mode}
          </p>
        </div>
        <span
          className={`text-[10px] font-mono ${config.color} ${config.bg} border ${config.border} px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${isActive ? "animate-pulse" : ""}`}
        >
          {config.label}
        </span>
      </div>

      {/* Stage progress */}
      <div className="flex gap-1 mb-4">
        {PIPELINE_STAGES.map((stage, i) => {
          const isCurrent = stage === run.status;
          const isPast = i < stageIndex;
          const stageConf = STATUS_CONFIG[stage];
          return (
            <div
              key={stage}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                isCurrent
                  ? `${stageConf.bg.replace("/10", "/40")} ${isActive ? "animate-pulse" : ""}`
                  : isPast
                    ? "bg-signal-green/30"
                    : "bg-ink-800/40"
              }`}
            />
          );
        })}
      </div>

      {/* Details row */}
      <div className="flex items-center gap-4 flex-wrap">
        {run.sourcesImported !== undefined && (
          <span className="text-[10px] font-mono text-ink-500">
            {run.sourcesImported}/{run.sourcesFound ?? "?"} fontes
          </span>
        )}
        <div className="flex gap-1.5">
          {run.platforms.map((p) => {
            const pl = PLATFORM_LABELS[p];
            return pl ? (
              <span
                key={p}
                className={`text-[10px] font-mono ${pl.color} ${
                  run.status === "published" ? "opacity-100" : "opacity-50"
                }`}
              >
                {pl.short}
              </span>
            ) : null;
          })}
        </div>
        {run.timings?.totalMs && (
          <span className="text-[10px] font-mono text-ink-600">
            {formatMs(run.timings.totalMs)}
          </span>
        )}
        {run.tokenUsage && (
          <span className="text-[10px] font-mono text-ink-600">
            {formatTokens(run.tokenUsage.totalTokens)} tok · ${run.tokenUsage.costUsd.toFixed(4)}
          </span>
        )}
        {run.error && (
          <span className="text-[10px] font-mono text-signal-red truncate max-w-[200px]">
            {run.error}
          </span>
        )}
        {hasDeliverables && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-mono text-signal-purple hover:text-signal-purple/80 transition-colors cursor-pointer"
          >
            {expanded ? "▾ ocultar" : "▸ ver entregaveis"}
          </button>
        )}
      </div>

      {/* Deliverables panel */}
      {expanded && hasDeliverables && (
        <div className="mt-4 pt-4 border-t border-ink-800/40 space-y-3 animate-fade-in">
          {run.deliverables!.map((d, i) => {
            const pl = PLATFORM_LABELS[d.platform];
            return (
              <div key={i} className="rounded-lg bg-ink-950/60 border border-ink-800/40 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-ink-800/30">
                  <span className={`text-[10px] font-mono font-semibold ${pl?.color ?? "text-ink-400"}`}>
                    {pl?.short ?? d.platform}
                  </span>
                  <span className="text-[10px] font-mono text-ink-600">
                    {d.fileType}
                  </span>
                  {d.filePath && (
                    <span className="text-[9px] font-mono text-ink-700 truncate ml-auto max-w-[200px]">
                      {d.filePath.split("/").slice(-2).join("/")}
                    </span>
                  )}
                </div>
                {d.content && (
                  <div className="px-3 py-2 max-h-[200px] overflow-y-auto">
                    <pre className="text-[11px] text-ink-300 whitespace-pre-wrap font-[family-name:var(--font-body)] leading-relaxed">
                      {d.content}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[10px] sm:text-[11px] font-mono text-ink-500 tracking-wider uppercase mb-3">
      {text}
    </p>
  );
}

function MetricCard({
  label,
  value,
  accent,
  subtitle,
}: {
  label: string;
  value: string;
  accent: "purple" | "amber" | "blue" | "green";
  subtitle?: string;
}) {
  const colors = {
    purple: { text: "text-signal-purple", border: "border-signal-purple/20" },
    amber: { text: "text-amber-glow", border: "border-amber-glow/20" },
    blue: { text: "text-signal-blue", border: "border-signal-blue/20" },
    green: { text: "text-signal-green", border: "border-signal-green/20" },
  };
  const c = colors[accent];

  return (
    <div className={`bg-ink-900/40 border ${c.border} rounded-lg p-3 sm:p-4`}>
      <p className="text-[10px] sm:text-[11px] font-mono text-ink-500 tracking-wider uppercase mb-1.5">
        {label}
      </p>
      <span
        className={`text-xl sm:text-2xl font-[family-name:var(--font-display)] font-bold ${c.text}`}
      >
        {value}
      </span>
      {subtitle && (
        <p className="text-[9px] font-mono text-ink-600 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

function TimingBar({
  label,
  ms,
  maxMs,
  color,
}: {
  label: string;
  ms: number;
  maxMs: number;
  color: string;
}) {
  const pct = maxMs > 0 ? (ms / maxMs) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-mono text-ink-400 w-20 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-ink-800/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(pct, ms > 0 ? 4 : 0)}%` }}
        />
      </div>
      <span className="text-[11px] font-mono text-ink-500 w-16 text-right flex-shrink-0">
        {ms > 0 ? formatMs(ms) : "—"}
      </span>
    </div>
  );
}

/* ── Helpers ── */

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const remaining = Math.round(s % 60);
  return `${m}m${remaining > 0 ? `${remaining}s` : ""}`;
}

function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  return `${(tokens / 1000).toFixed(1)}k`;
}

function groupByMonth(runs: ContentRun[]): Record<string, ContentRun[]> {
  const groups: Record<string, ContentRun[]> = {};
  for (const run of runs) {
    const key = new Date(run.createdAt).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(run);
  }
  return groups;
}
