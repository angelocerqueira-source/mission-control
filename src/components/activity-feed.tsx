"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  task_created: { icon: "+", color: "text-signal-blue", bg: "bg-signal-blue/10" },
  message_sent: { icon: "#", color: "text-ink-400", bg: "bg-ink-800/50" },
  document_created: { icon: "~", color: "text-signal-purple", bg: "bg-signal-purple/10" },
  status_changed: { icon: ">", color: "text-signal-amber", bg: "bg-signal-amber/10" },
  agent_woke: { icon: "*", color: "text-signal-green", bg: "bg-signal-green/10" },
};

export function ActivityFeed() {
  const activities = useQuery(api.activities.list, { limit: 30 });

  if (!activities) {
    return (
      <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-4 sm:p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 sm:h-5 bg-ink-800/50 rounded animate-pulse" style={{ width: `${70 - i * 8}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-ink-900/40 border border-dashed border-ink-700 rounded-lg p-8 sm:p-10 text-center">
        <div className="font-mono text-ink-600 text-xs sm:text-sm">
          <span className="text-ink-500">&gt;</span> aguardando atividade...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg overflow-hidden">
      {/* Terminal-style header */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-ink-800/50 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-signal-red/60" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-signal-amber/60" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-signal-green/60" />
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono text-ink-600 ml-1 sm:ml-2 tracking-wider">
          activity.log — {activities.length} entries
        </span>
      </div>

      <div className="max-h-[320px] sm:max-h-[420px] overflow-y-auto divide-y divide-ink-800/30">
        {activities.map((activity, i) => {
          const config = TYPE_CONFIG[activity.type] ?? { icon: "?", color: "text-ink-400", bg: "bg-ink-800/50" };

          return (
            <div
              key={activity._id}
              className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-ink-800/20 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center font-mono text-[10px] sm:text-xs font-bold ${config.color} ${config.bg}`}
              >
                {config.icon}
              </span>
              <span className="flex-1 text-xs sm:text-sm text-ink-300 leading-relaxed min-w-0">
                {activity.message}
              </span>
              <span className="flex-shrink-0 text-[9px] sm:text-[11px] font-mono text-ink-600 tabular-nums">
                {new Date(activity.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
