"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function estimateCost(input: number, output: number): string {
  // GPT-5-mini pricing estimate: $0.30/1M input, $1.20/1M output
  const cost = (input * 0.3 + output * 1.2) / 1_000_000;
  if (cost < 0.01) return "<$0.01";
  return `$${cost.toFixed(2)}`;
}

function relativeTime(timestamp?: number): string {
  if (!timestamp) return "—";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export function TokenUsage() {
  const byAgent = useQuery(api.tokenUsage.getLatestByAgent);
  const totals = useQuery(api.tokenUsage.getTotals);

  if (!byAgent || !totals) {
    return (
      <div className="space-y-3">
        <div className="h-[72px] rounded-lg bg-ink-900/50 border border-ink-800/50 animate-pulse" />
        <div className="h-[200px] rounded-lg bg-ink-900/50 border border-ink-800/50 animate-pulse" />
      </div>
    );
  }

  const agents = Object.values(byAgent).sort(
    (a, b) => b.totalTokens - a.totalTokens
  );

  if (agents.length === 0) {
    return (
      <div className="bg-ink-900/40 border border-dashed border-ink-700 rounded-lg p-6 text-center">
        <p className="font-mono text-xs text-ink-500">
          Nenhum dado de tokens coletado
        </p>
        <p className="font-mono text-[10px] text-ink-600 mt-1">
          Execute: node collect-tokens.js
        </p>
      </div>
    );
  }

  const maxTokens = Math.max(...agents.map((a) => a.totalTokens));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard
          label="Total Tokens"
          value={formatTokens(totals.totalTokens)}
        />
        <StatCard
          label="Input"
          value={formatTokens(totals.totalInput)}
          sub="prompt"
        />
        <StatCard
          label="Output"
          value={formatTokens(totals.totalOutput)}
          sub="completion"
        />
        <StatCard
          label="Custo Est."
          value={estimateCost(totals.totalInput, totals.totalOutput)}
          sub={`${totals.totalRuns} runs`}
        />
      </div>

      {/* Per-agent breakdown */}
      <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-ink-800/40">
          <span className="text-[10px] font-mono text-ink-500 tracking-wider uppercase">
            Consumo por agente
          </span>
        </div>
        <div className="divide-y divide-ink-800/30">
          {agents.map((agent, i) => {
            const pct =
              maxTokens > 0
                ? Math.max(2, (agent.totalTokens / maxTokens) * 100)
                : 0;
            const cost = estimateCost(agent.inputTokens, agent.outputTokens);

            return (
              <div
                key={agent.agentId}
                className="px-3 py-2.5 hover:bg-ink-800/20 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-ink-200 truncate">
                      {agent.agentName}
                    </span>
                    <span className="text-[9px] font-mono text-ink-600">
                      {agent.runs} runs
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-mono text-ink-400 tabular-nums">
                      {formatTokens(agent.totalTokens)}
                    </span>
                    <span className="text-[9px] font-mono text-amber-glow/60 tabular-nums w-12 text-right">
                      {cost}
                    </span>
                  </div>
                </div>
                {/* Bar */}
                <div className="h-1 bg-ink-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-glow/40 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] font-mono text-ink-600 tabular-nums">
                    in: {formatTokens(agent.inputTokens)} · out:{" "}
                    {formatTokens(agent.outputTokens)}
                  </span>
                  <span className="text-[8px] font-mono text-ink-600">
                    {relativeTime(agent.collectedAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-ink-900/60 border border-ink-800/60 rounded-lg px-3 py-2.5">
      <p className="text-[9px] font-mono text-ink-500 tracking-wider uppercase mb-1">
        {label}
      </p>
      <p className="text-sm sm:text-base font-semibold text-ink-100 font-mono tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="text-[9px] font-mono text-ink-600 mt-0.5">{sub}</p>
      )}
    </div>
  );
}
