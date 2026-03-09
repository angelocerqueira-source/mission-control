"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { TaskDetailSheet } from "./task-detail-sheet";

const COLUMNS = [
  { key: "inbox", label: "Inbox", accent: "bg-ink-500" },
  { key: "assigned", label: "Assigned", accent: "bg-signal-blue" },
  { key: "in_progress", label: "In Progress", accent: "bg-signal-amber" },
  { key: "review", label: "Review", accent: "bg-signal-purple" },
  { key: "done", label: "Done", accent: "bg-signal-green" },
  { key: "blocked", label: "Blocked", accent: "bg-signal-red" },
] as const;

const PRIORITY_CONFIG: Record<string, { dot: string; label: string }> = {
  low: { dot: "bg-ink-500", label: "low" },
  medium: { dot: "bg-signal-blue", label: "med" },
  high: { dot: "bg-signal-amber", label: "high" },
  urgent: { dot: "bg-signal-red animate-pulse", label: "urg" },
};

export function TaskBoard() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const createTask = useMutation(api.tasks.create);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

  if (!tasks || !agents) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[240px] min-w-[160px] flex-1 rounded-lg bg-ink-900/30 border border-ink-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a.name]));
  const selectedTask = selectedTaskId
    ? tasks.find((t) => t._id === selectedTaskId) ?? null
    : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask({ title: title.trim(), description: description.trim(), priority });
    setTitle("");
    setDescription("");
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center sm:items-baseline justify-between mb-4 sm:mb-5 gap-3">
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-base sm:text-lg font-semibold text-ink-100">
            Task Board
          </h2>
          <span className="text-[10px] sm:text-xs font-mono text-ink-500 tracking-wider">
            {tasks.length} tarefas
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[10px] sm:text-xs font-mono tracking-wider uppercase px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-glow/10 text-amber-glow border border-amber-glow/20 rounded-md hover:bg-amber-glow/20 hover:border-amber-glow/40 transition-all duration-200 flex-shrink-0"
        >
          + Nova Tarefa
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-5 sm:mb-6 p-4 sm:p-5 border border-ink-700/60 rounded-lg bg-ink-900/60 space-y-3 animate-fade-in"
        >
          <input
            type="text"
            placeholder="Titulo da tarefa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-ink-950 border border-ink-700/60 rounded-md text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-glow/40 focus:ring-1 focus:ring-amber-glow/10 transition-colors"
          />
          <textarea
            placeholder="Descricao (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-ink-950 border border-ink-700/60 rounded-md text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-glow/40 focus:ring-1 focus:ring-amber-glow/10 transition-colors resize-none"
            rows={2}
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {(["low", "medium", "high", "urgent"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`text-[10px] font-mono tracking-wider uppercase px-2 sm:px-2.5 py-1 rounded border transition-all ${
                    priority === p
                      ? "bg-amber-glow/15 text-amber-glow border-amber-glow/30"
                      : "bg-transparent text-ink-500 border-ink-700 hover:border-ink-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-[10px] sm:text-xs font-mono text-ink-500 hover:text-ink-300 transition-colors px-2 sm:px-3 py-1.5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="text-[10px] sm:text-xs font-mono tracking-wider uppercase px-3 sm:px-4 py-1.5 bg-amber-glow text-ink-950 rounded-md hover:bg-amber-dim transition-colors font-semibold"
              >
                Criar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Kanban: horizontal scroll on mobile, grid on desktop */}
      <div className="flex lg:grid lg:grid-cols-6 gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory lg:snap-none">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="bg-ink-900/30 border border-ink-800/40 rounded-lg overflow-hidden min-h-[180px] sm:min-h-[220px] min-w-[200px] sm:min-w-[220px] lg:min-w-0 flex-shrink-0 lg:flex-shrink snap-start"
            >
              {/* Column header */}
              <div className="px-3 py-2 sm:py-2.5 border-b border-ink-800/40 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${col.accent}`} />
                <h3 className="text-[10px] font-mono font-semibold text-ink-400 uppercase tracking-widest flex-1">
                  {col.label}
                </h3>
                <span className="text-[10px] font-mono text-ink-600 tabular-nums">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2">
                {colTasks.map((task, i) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    assignees={task.assigneeIds
                      .map((id: Id<"agents">) => agentMap.get(id) ?? "?")
                      .join(", ")}
                    index={i}
                    onSelect={() => setSelectedTaskId(task._id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile scroll hint */}
      <div className="flex lg:hidden items-center justify-center mt-3 gap-1">
        {COLUMNS.map((col) => (
          <span key={col.key} className={`w-1 h-1 rounded-full ${col.accent} opacity-40`} />
        ))}
      </div>

      {/* Task detail sheet */}
      <TaskDetailSheet
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        agentMap={agentMap}
      />
    </div>
  );
}

function TaskCard({
  task,
  assignees,
  index,
  onSelect,
}: {
  task: { _id: string; title: string; priority: string; description: string };
  assignees: string;
  index: number;
  onSelect: () => void;
}) {
  const prioConfig = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  return (
    <div
      className="bg-ink-900/60 border border-ink-800/50 rounded-md p-2 sm:p-2.5 cursor-pointer hover:border-ink-600/60 hover:bg-ink-800/40 transition-all duration-200 animate-fade-in group"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${prioConfig.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-ink-200 leading-snug group-hover:text-ink-50 transition-colors">{task.title}</p>
          {assignees && (
            <p className="text-[10px] font-mono text-ink-600 mt-1 truncate">{assignees}</p>
          )}
        </div>
        {/* Open icon hint */}
        <span className="text-ink-700 group-hover:text-ink-500 transition-colors mt-0.5 flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M4.5 2.5L8 6L4.5 9.5" />
          </svg>
        </span>
      </div>
      <div className="flex items-center justify-between mt-1.5 sm:mt-2">
        <span className="text-[9px] font-mono uppercase tracking-widest text-ink-600">
          {prioConfig.label}
        </span>
      </div>
    </div>
  );
}
