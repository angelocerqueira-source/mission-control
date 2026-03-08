"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";

const AGENT_INITIALS: Record<string, string> = {
  Atlas: "AT",
  Scout: "SC",
  Fury: "FY",
  Growth: "GR",
  Scribe: "SR",
  Quill: "QL",
  Wanda: "WD",
  Funnel: "FN",
  Friday: "FR",
  Ops: "OP",
  Babel: "BB",
  Banker: "BK",
};

const IDLE_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

function getEffectiveStatus(agent: { status: string; lastActiveAt?: number }): "idle" | "active" | "blocked" {
  if (agent.status === "blocked") return "blocked";
  if (!agent.lastActiveAt) return "idle";

  const elapsed = Date.now() - agent.lastActiveAt;
  if (agent.status === "active" && elapsed > IDLE_THRESHOLD_MS) return "idle";
  return agent.status as "idle" | "active" | "blocked";
}

function relativeTime(timestamp?: number): string {
  if (!timestamp) return "sem atividade";
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

const STATUS_CONFIG = {
  idle: {
    dot: "bg-ink-500",
    label: "idle",
    labelClass: "text-ink-500 border-ink-700",
    cardBorder: "border-ink-800",
  },
  active: {
    dot: "bg-signal-green animate-pulse",
    label: "online",
    labelClass: "text-signal-green border-signal-green/30",
    cardBorder: "border-signal-green/20",
  },
  blocked: {
    dot: "bg-signal-red",
    label: "blocked",
    labelClass: "text-signal-red border-signal-red/30",
    cardBorder: "border-signal-red/20",
  },
};

export function AgentCards() {
  const agents = useQuery(api.agents.list);
  const [, setTick] = useState(0);

  // Re-render every 30s to update relative times and auto-decay
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!agents) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] sm:h-[100px] rounded-lg bg-ink-900/50 border border-ink-800/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="bg-ink-900/40 border border-dashed border-ink-700 rounded-lg p-6 sm:p-8 text-center">
        <p className="font-mono text-xs sm:text-sm text-ink-500">
          Nenhum agente registrado
        </p>
        <p className="font-mono text-[10px] sm:text-xs text-ink-600 mt-1">
          Registre agentes pelo Convex Dashboard
        </p>
      </div>
    );
  }

  const activeCount = agents.filter((a) => getEffectiveStatus(a) === "active").length;

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] sm:text-[11px] font-mono text-ink-500 tracking-wider uppercase">
          {activeCount}/{agents.length} online
        </span>
        {activeCount > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {agents.map((agent, i) => {
          const effectiveStatus = getEffectiveStatus(agent);
          const config = STATUS_CONFIG[effectiveStatus];
          const initials = AGENT_INITIALS[agent.name] ?? agent.name.slice(0, 2).toUpperCase();
          const lastActive = relativeTime(agent.lastActiveAt);

          return (
            <div
              key={agent._id}
              className={`group relative bg-ink-900/60 border ${config.cardBorder} rounded-lg p-3 sm:p-4 transition-all duration-300 hover:bg-ink-900/90 hover:border-ink-600 animate-fade-in`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-ink-800 flex items-center justify-center font-mono text-[10px] sm:text-xs font-semibold text-amber-glow/80 border border-ink-700/50 group-hover:border-amber-glow/20 transition-colors flex-shrink-0 relative">
                  {initials}
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${config.dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-ink-100 truncate">
                    {agent.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-ink-500 truncate">{agent.role}</p>
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-center justify-between gap-1">
                <span
                  className={`inline-block text-[9px] sm:text-[10px] font-mono tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded border ${config.labelClass}`}
                >
                  {config.label}
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono text-ink-600 tabular-nums truncate">
                  {lastActive}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
