"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { MarkdownProse } from "./markdown-prose";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  deliverable: { icon: "▸", color: "text-amber-glow", bg: "bg-amber-glow/10", label: "deliverable" },
  research: { icon: "◆", color: "text-signal-blue", bg: "bg-signal-blue/10", label: "research" },
  protocol: { icon: "§", color: "text-signal-purple", bg: "bg-signal-purple/10", label: "protocol" },
};

export function DocumentPanel() {
  const documents = useQuery(api.documents.list);
  const tasks = useQuery(api.tasks.list);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const taskMap = new Map(tasks?.map((t) => [t._id, t.title]) ?? []);

  if (!documents) {
    return (
      <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-4 sm:p-6">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 sm:h-12 bg-ink-800/50 rounded animate-pulse" style={{ width: `${90 - i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-ink-900/40 border border-dashed border-ink-700 rounded-lg p-8 sm:p-10 text-center">
        <div className="font-mono text-ink-600 text-xs sm:text-sm">
          <span className="text-ink-500">~/docs</span> <span className="text-ink-700">/</span> vazio
        </div>
        <p className="text-[10px] sm:text-xs font-mono text-ink-700 mt-2">
          documentos aparecem aqui quando agentes criam deliverables, pesquisas ou protocolos
        </p>
      </div>
    );
  }

  return (
    <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg overflow-hidden">
      {/* File browser header */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-ink-800/50 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-signal-purple/60" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-signal-blue/60" />
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-glow/60" />
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono text-ink-600 ml-1 sm:ml-2 tracking-wider">
          ~/docs — {documents.length} {documents.length === 1 ? "arquivo" : "arquivos"}
        </span>
      </div>

      <div className="max-h-[360px] sm:max-h-[460px] overflow-y-auto divide-y divide-ink-800/30">
        {documents.map((doc, i) => {
          const config = TYPE_CONFIG[doc.type] ?? TYPE_CONFIG.research;
          const isExpanded = expandedId === doc._id;
          const taskTitle = doc.taskId ? taskMap.get(doc.taskId) : null;

          return (
            <div
              key={doc._id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : doc._id)}
                className="w-full flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-ink-800/20 transition-colors text-left"
              >
                <span
                  className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center font-mono text-[10px] sm:text-xs font-bold ${config.color} ${config.bg}`}
                >
                  {config.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-ink-200 font-medium truncate">
                      {doc.title}
                    </span>
                    <span
                      className={`hidden sm:inline-block text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border ${config.color} border-current/20 opacity-60`}
                    >
                      {config.label}
                    </span>
                  </div>
                  {taskTitle && (
                    <span className="text-[10px] sm:text-[11px] font-mono text-ink-600 truncate block mt-0.5">
                      ↳ {taskTitle}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="text-[9px] sm:text-[11px] font-mono text-ink-600 tabular-nums">
                    {new Date(doc.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <span className={`text-[10px] font-mono text-ink-600 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}>
                    ▸
                  </span>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="ml-7 sm:ml-9 pl-3 sm:pl-4 border-l-2 border-ink-800/60">
                    <div className="bg-ink-950/60 rounded-md p-3 sm:p-4 overflow-x-auto max-h-[400px] overflow-y-auto overscroll-contain">
                      <MarkdownProse content={doc.content} />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[9px] sm:text-[10px] font-mono text-ink-700">
                      <span>{doc.content.length} chars</span>
                      <span>·</span>
                      <span>{doc.type}</span>
                      <span>·</span>
                      <span>
                        {new Date(doc.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
