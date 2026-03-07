"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const AGENT_INITIALS: Record<string, string> = {
  Jarvis: "JV",
  Shuri: "SH",
  Fury: "FY",
  Vision: "VN",
  Loki: "LK",
  Quill: "QL",
  Wanda: "WD",
  Pepper: "PP",
  Friday: "FR",
  Wong: "WG",
};

const STATUS_CONFIG = {
  idle: {
    dot: "bg-ink-500",
    label: "idle",
    labelClass: "text-ink-500 border-ink-700",
    cardBorder: "border-ink-800",
  },
  active: {
    dot: "bg-signal-green animate-pulse",
    label: "active",
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

  if (!agents) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-[72px] sm:h-[88px] rounded-lg bg-ink-900/50 border border-ink-800/50 animate-pulse"
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
      {agents.map((agent, i) => {
        const config = STATUS_CONFIG[agent.status];
        const initials = AGENT_INITIALS[agent.name] ?? agent.name.slice(0, 2).toUpperCase();

        return (
          <div
            key={agent._id}
            className={`group relative bg-ink-900/60 border ${config.cardBorder} rounded-lg p-3 sm:p-4 transition-all duration-300 hover:bg-ink-900/90 hover:border-ink-600 animate-fade-in`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-ink-800 flex items-center justify-center font-mono text-[10px] sm:text-xs font-semibold text-amber-glow/80 border border-ink-700/50 group-hover:border-amber-glow/20 transition-colors flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-ink-100 truncate">
                    {agent.name}
                  </h3>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
                </div>
                <p className="text-[10px] sm:text-[11px] text-ink-500 truncate">{agent.role}</p>
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <span
                className={`inline-block text-[9px] sm:text-[10px] font-mono tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded border ${config.labelClass}`}
              >
                {config.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
