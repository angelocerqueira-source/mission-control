"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { MarkdownProse } from "./markdown-prose";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Task {
  _id: Id<"tasks">;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeIds: Id<"agents">[];
  projectId?: Id<"projects">;
  createdAt: number;
}

interface TaskDetailSheetProps {
  task: Task | null;
  onClose: () => void;
  agentMap: Map<string, string>;
  projectMap?: Map<string, { name: string; color: string }>;
}

type SheetTab = "detalhes" | "entregaveis" | "atividade";

/* ------------------------------------------------------------------ */
/*  Config maps                                                        */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  inbox: {
    label: "Inbox",
    color: "text-ink-400",
    bg: "bg-ink-700/30",
    border: "border-ink-600/40",
    dot: "bg-ink-500",
  },
  assigned: {
    label: "Assigned",
    color: "text-signal-blue",
    bg: "bg-signal-blue/10",
    border: "border-signal-blue/25",
    dot: "bg-signal-blue",
  },
  in_progress: {
    label: "In Progress",
    color: "text-signal-amber",
    bg: "bg-signal-amber/10",
    border: "border-signal-amber/25",
    dot: "bg-signal-amber",
  },
  review: {
    label: "Review",
    color: "text-signal-purple",
    bg: "bg-signal-purple/10",
    border: "border-signal-purple/25",
    dot: "bg-signal-purple",
  },
  done: {
    label: "Done",
    color: "text-signal-green",
    bg: "bg-signal-green/10",
    border: "border-signal-green/25",
    dot: "bg-signal-green",
  },
  blocked: {
    label: "Blocked",
    color: "text-signal-red",
    bg: "bg-signal-red/10",
    border: "border-signal-red/25",
    dot: "bg-signal-red",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  low: { label: "Low", color: "text-ink-500", icon: "—" },
  medium: { label: "Medium", color: "text-signal-blue", icon: "●" },
  high: { label: "High", color: "text-signal-amber", icon: "▲" },
  urgent: { label: "Urgent", color: "text-signal-red", icon: "⬆" },
};

const TABS: { id: SheetTab; label: string }[] = [
  { id: "detalhes", label: "Detalhes" },
  { id: "entregaveis", label: "Entregáveis" },
  { id: "atividade", label: "Atividade" },
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const PROJECT_COLORS: Record<string, string> = {
  blue: "bg-signal-blue",
  green: "bg-signal-green",
  amber: "bg-signal-amber",
  purple: "bg-signal-purple",
  red: "bg-signal-red",
  cyan: "bg-signal-blue/60",
};

export function TaskDetailSheet({
  task,
  onClose,
  agentMap,
  projectMap,
}: TaskDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<SheetTab>("detalhes");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (task) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setActiveTab("detalhes");
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [task, handleKeyDown]);

  if (!task) return null;

  const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.inbox;
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const assigneeNames = task.assigneeIds
    .map((id) => agentMap.get(id) ?? "—")
    .filter(Boolean);

  /* Portal to body — escapes any ancestor with transform/filter/backdrop-filter
     which would break position:fixed containment */
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-[2px]"
        style={{ animation: "sheetBackdropIn 0.2s ease-out both" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={task.title}
        className="fixed top-0 right-0 z-50 w-full sm:w-[min(680px,100vw-32px)] h-dvh bg-ink-950 border-l border-ink-800/60 shadow-2xl shadow-black/50 flex flex-col"
        style={{ animation: "sheetSlideIn 0.28s cubic-bezier(0.32,0.72,0,1) both" }}
      >
        {/* ── Header ── */}
        <header className="shrink-0 border-b border-ink-800/50">
          {/* Top row: badges + close */}
          <div className="flex items-center justify-between px-5 sm:px-7 pt-4 pb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded border ${status.color} ${status.bg} ${status.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span
                className={`text-[10px] font-mono tracking-wider ${priority.color}`}
              >
                {priority.icon} {priority.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-ink-500 hover:text-ink-200 hover:bg-ink-800/60 transition-colors cursor-pointer flex-shrink-0"
              aria-label="Fechar"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>

          {/* Title */}
          <div className="px-5 sm:px-7 pb-3">
            <h2 className="font-[family-name:var(--font-display)] text-base sm:text-lg font-semibold text-ink-50 leading-snug">
              {task.title}
            </h2>
          </div>

          {/* Tab bar */}
          <nav className="flex items-end px-5 sm:px-7 gap-0 -mb-px">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-4 py-2 text-[11px] font-mono tracking-wider uppercase
                    transition-colors duration-150 cursor-pointer
                    border-b-2 -mb-[1px]
                    ${isActive
                      ? "text-amber-glow border-amber-glow"
                      : "text-ink-500 border-transparent hover:text-ink-300 hover:border-ink-700"
                    }
                  `}
                >
                  {tab.label}
                  {tab.id === "entregaveis" && (
                    <DocCount taskId={task._id} />
                  )}
                  {tab.id === "atividade" && (
                    <MsgCount taskId={task._id} />
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ minHeight: 0 }}>
          <div className="px-5 sm:px-7 py-5">
            {activeTab === "detalhes" && (
              <DetailsTab
                task={task}
                status={status}
                priority={priority}
                assigneeNames={assigneeNames}
                project={task.projectId && projectMap ? projectMap.get(task.projectId) : undefined}
              />
            )}
            {activeTab === "entregaveis" && (
              <DeliverablesTab taskId={task._id} />
            )}
            {activeTab === "atividade" && (
              <ActivityTab taskId={task._id} agentMap={agentMap} />
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="shrink-0 px-5 sm:px-7 py-2.5 border-t border-ink-800/40 flex items-center justify-between">
          <span className="text-[10px] font-mono text-ink-600 tracking-wider select-all">
            {task._id}
          </span>
          <span className="text-[10px] font-mono text-ink-700">
            esc para fechar
          </span>
        </footer>
      </div>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes sheetSlideIn {
          from { transform: translateX(100%); opacity: 0.5; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes sheetBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Detalhes                                                      */
/* ------------------------------------------------------------------ */

function DetailsTab({
  task,
  status,
  priority,
  assigneeNames,
  project,
}: {
  task: Task;
  status: (typeof STATUS_CONFIG)[string];
  priority: (typeof PRIORITY_CONFIG)[string];
  assigneeNames: string[];
  project?: { name: string; color: string };
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <MetaField label="Status">
          <span className={`inline-flex items-center gap-1.5 ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </MetaField>
        <MetaField label="Prioridade">
          <span className={priority.color}>
            {priority.icon} {priority.label}
          </span>
        </MetaField>
        <MetaField label="Assignees">
          {assigneeNames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assigneeNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 text-ink-200"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-glow/15 border border-amber-glow/25 flex items-center justify-center text-[9px] font-mono text-amber-glow font-semibold flex-shrink-0">
                    {name.charAt(0)}
                  </span>
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-ink-600">Nenhum</span>
          )}
        </MetaField>
        <MetaField label="Criada em">
          <span className="text-ink-300">
            {new Date(task.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </MetaField>
        <MetaField label="Projeto">
          {project ? (
            <span className="inline-flex items-center gap-1.5 text-ink-200">
              <span className={`w-2 h-2 rounded-full ${PROJECT_COLORS[project.color] ?? "bg-ink-500"}`} />
              {project.name}
            </span>
          ) : (
            <span className="text-ink-600">Nenhum</span>
          )}
        </MetaField>
      </div>

      <div className="border-t border-ink-800/40" />

      {/* Description */}
      <section>
        <SectionLabel>Descrição</SectionLabel>
        {task.description ? (
          <MarkdownProse content={task.description} />
        ) : (
          <EmptyState icon="~" text="Sem descrição." />
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Entregáveis                                                   */
/* ------------------------------------------------------------------ */

function DeliverablesTab({ taskId }: { taskId: Id<"tasks"> }) {
  const documents = useQuery(api.documents.listByTask, { taskId });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!documents) {
    return (
      <div className="space-y-3 animate-fade-in">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 bg-ink-900/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="animate-fade-in">
        <EmptyState icon="◇" text="Nenhum entregável vinculado a esta task." />
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {documents.map((doc) => {
        const isExpanded = expandedId === doc._id;
        const typeIcon = doc.type === "research" ? "◈" : doc.type === "deliverable" ? "◆" : "◇";
        const typeColor = doc.type === "research" ? "text-signal-purple" : doc.type === "deliverable" ? "text-signal-green" : "text-ink-500";

        return (
          <div
            key={doc._id}
            className="border border-ink-800/40 rounded-lg overflow-hidden bg-ink-900/20 hover:border-ink-700/50 transition-colors"
          >
            {/* Header row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : doc._id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer group"
            >
              <span className={`${typeColor} text-sm flex-shrink-0`}>{typeIcon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-[13px] text-ink-200 font-medium truncate group-hover:text-ink-50 transition-colors">
                  {doc.title}
                </p>
                <p className="text-[10px] font-mono text-ink-600 mt-0.5">
                  {doc.type} · {new Date(doc.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
                className={`text-ink-600 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
              >
                <path d="M4.5 2.5L8 6L4.5 9.5" />
              </svg>
            </button>

            {/* Expanded content */}
            {isExpanded && doc.content && (
              <div className="border-t border-ink-800/30 px-4 py-4 max-h-[50vh] overflow-y-auto overscroll-contain">
                <MarkdownProse content={doc.content} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Atividade                                                     */
/* ------------------------------------------------------------------ */

function ActivityTab({
  taskId,
  agentMap,
}: {
  taskId: Id<"tasks">;
  agentMap: Map<string, string>;
}) {
  const messages = useQuery(api.messages.listByTask, { taskId });

  if (!messages) {
    return (
      <div className="space-y-4 animate-fade-in">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-ink-800/60 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-ink-800/40 rounded animate-pulse w-1/4" />
              <div className="h-12 bg-ink-800/40 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="animate-fade-in">
        <EmptyState icon="#" text="Nenhum comentário ainda." />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {messages.map((msg) => {
        const agentName = agentMap.get(msg.fromAgentId) ?? "Agent";
        return (
          <div key={msg._id} className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-amber-glow/12 border border-amber-glow/20 flex items-center justify-center text-[10px] font-mono text-amber-glow font-semibold flex-shrink-0 mt-0.5">
              {agentName.charAt(0)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-[11px] sm:text-xs font-mono font-semibold text-ink-200">
                  {agentName}
                </span>
                <time className="text-[10px] font-mono text-ink-600">
                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <div className="text-[12px] sm:text-[13px] text-ink-300 leading-relaxed whitespace-pre-wrap break-words bg-ink-900/40 border border-ink-800/30 rounded-lg px-3.5 py-2.5">
                {msg.content}
              </div>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.attachments.map((att: string, i: number) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono text-signal-blue bg-signal-blue/8 border border-signal-blue/15 px-2 py-0.5 rounded"
                    >
                      {att}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared pieces                                                      */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] sm:text-[11px] font-mono text-ink-500 tracking-wider uppercase mb-3">
      {children}
    </h3>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-[10px] font-mono text-ink-600 tracking-wider uppercase mb-1">
        {label}
      </span>
      <div className="text-xs font-mono">{children}</div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5 py-4 px-4 bg-ink-900/25 border border-ink-800/30 rounded-lg">
      <span className="text-ink-600 text-sm">{icon}</span>
      <span className="text-xs text-ink-500">{text}</span>
    </div>
  );
}

/* ---- Badge counters for tabs ---- */

function DocCount({ taskId }: { taskId: Id<"tasks"> }) {
  const docs = useQuery(api.documents.listByTask, { taskId });
  if (!docs || docs.length === 0) return null;
  return (
    <span className="ml-1.5 text-[9px] bg-signal-purple/15 text-signal-purple px-1.5 py-0.5 rounded-full font-semibold tabular-nums">
      {docs.length}
    </span>
  );
}

function MsgCount({ taskId }: { taskId: Id<"tasks"> }) {
  const msgs = useQuery(api.messages.listByTask, { taskId });
  if (!msgs || msgs.length === 0) return null;
  return (
    <span className="ml-1.5 text-[9px] bg-amber-glow/15 text-amber-glow px-1.5 py-0.5 rounded-full font-semibold tabular-nums">
      {msgs.length}
    </span>
  );
}
