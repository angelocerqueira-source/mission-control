"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { TaskDetailSheet } from "./task-detail-sheet";

/* ── Constants ── */

const COLUMNS = [
  { key: "in_progress", label: "Em andamento", accent: "bg-signal-amber", accentText: "text-signal-amber" },
  { key: "assigned", label: "Atribuídas", accent: "bg-signal-blue", accentText: "text-signal-blue" },
  { key: "review", label: "Review", accent: "bg-signal-purple", accentText: "text-signal-purple" },
  { key: "blocked", label: "Bloqueadas", accent: "bg-signal-red", accentText: "text-signal-red" },
  { key: "inbox", label: "Inbox", accent: "bg-ink-500", accentText: "text-ink-500" },
  { key: "done", label: "Concluídas", accent: "bg-signal-green", accentText: "text-signal-green" },
] as const;

const PRIORITY_CONFIG: Record<string, { dot: string; label: string }> = {
  low: { dot: "bg-ink-500", label: "low" },
  medium: { dot: "bg-signal-blue", label: "med" },
  high: { dot: "bg-signal-amber", label: "high" },
  urgent: { dot: "bg-signal-red animate-pulse", label: "urg" },
};

const PROJECT_COLORS: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
  blue:   { bg: "bg-signal-blue/12", text: "text-signal-blue", dot: "bg-signal-blue", ring: "ring-signal-blue/30" },
  green:  { bg: "bg-signal-green/12", text: "text-signal-green", dot: "bg-signal-green", ring: "ring-signal-green/30" },
  amber:  { bg: "bg-signal-amber/12", text: "text-signal-amber", dot: "bg-signal-amber", ring: "ring-signal-amber/30" },
  purple: { bg: "bg-signal-purple/12", text: "text-signal-purple", dot: "bg-signal-purple", ring: "ring-signal-purple/30" },
  red:    { bg: "bg-signal-red/12", text: "text-signal-red", dot: "bg-signal-red", ring: "ring-signal-red/30" },
  cyan:   { bg: "bg-signal-blue/8", text: "text-signal-blue/70", dot: "bg-signal-blue/60", ring: "ring-signal-blue/20" },
};

const COLOR_PRESETS = [
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde" },
  { value: "amber", label: "Amber" },
  { value: "purple", label: "Roxo" },
  { value: "red", label: "Vermelho" },
  { value: "cyan", label: "Cyan" },
];

const DEFAULT_PROJECT_COLOR = PROJECT_COLORS.blue;

type FilterState = {
  search: string;
  priority: string;
  agentId: string;
  deliverables: string;
  period: string;
  projectId: string;
};

const EMPTY_FILTERS: FilterState = {
  search: "",
  priority: "",
  agentId: "",
  deliverables: "",
  period: "",
  projectId: "",
};

const DONE_PREVIEW_COUNT = 5;

/* ── Filter logic ── */

function matchesFilters(
  task: { _id: string; title: string; priority: string; assigneeIds: string[]; createdAt: number; projectId?: string },
  filters: FilterState,
  taskIdsWithDocs: Set<string>,
): boolean {
  if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
  if (filters.priority && task.priority !== filters.priority) return false;
  if (filters.agentId && !task.assigneeIds.includes(filters.agentId)) return false;
  if (filters.deliverables === "with" && !taskIdsWithDocs.has(task._id)) return false;
  if (filters.deliverables === "without" && taskIdsWithDocs.has(task._id)) return false;
  if (filters.period === "7d" && task.createdAt < Date.now() - 7 * 86400000) return false;
  if (filters.period === "30d" && task.createdAt < Date.now() - 30 * 86400000) return false;
  if (filters.projectId === "_none" && task.projectId) return false;
  if (filters.projectId && filters.projectId !== "_none" && task.projectId !== filters.projectId) return false;
  return true;
}

/* ════════════════════════════════════════════════════════════════════════ */
/*  TaskBoard                                                              */
/* ════════════════════════════════════════════════════════════════════════ */

export function TaskBoard() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const documents = useQuery(api.documents.list);
  const projects = useQuery(api.projects.list);
  const createTask = useMutation(api.tasks.create);
  const createProject = useMutation(api.projects.create);
  const removeProject = useMutation(api.projects.remove);

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedDone, setExpandedDone] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  // Task creation form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [selectedProjectForCreate, setSelectedProjectForCreate] = useState("");

  if (!tasks || !agents) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-ink-900/30 border border-ink-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a.name]));
  const projectMap = new Map((projects ?? []).map((p) => [p._id, p]));
  const taskIdsWithDocs = new Set((documents ?? []).map((d) => d.taskId).filter(Boolean) as string[]);
  const activeFilterCount = Object.entries(filters).filter(([, v]) => v).length;
  const filteredTasks = tasks.filter((t) => matchesFilters(t, filters, taskIdsWithDocs));
  const selectedTask = selectedTaskId ? tasks.find((t) => t._id === selectedTaskId) ?? null : null;

  // Project task counts
  const projectTaskCounts = new Map<string, number>();
  for (const t of tasks) {
    if (t.projectId) projectTaskCounts.set(t.projectId, (projectTaskCounts.get(t.projectId) ?? 0) + 1);
  }
  const unassignedCount = tasks.filter((t) => !t.projectId).length;

  const statusCounts = COLUMNS.map((col) => ({
    ...col,
    count: filteredTasks.filter((t) => t.status === col.key).length,
  }));

  function toggleCollapse(key: string) {
    setCollapsedCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleProjectFilter(projectId: string) {
    setFilters((f) => ({
      ...f,
      projectId: f.projectId === projectId ? "" : projectId,
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      ...(selectedProjectForCreate ? { projectId: selectedProjectForCreate as Id<"projects"> } : {}),
    });
    setTitle("");
    setDescription("");
    setSelectedProjectForCreate("");
    setShowForm(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5 gap-3">
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-base sm:text-lg font-semibold text-ink-100">
            Task Board
          </h2>
          <span className="text-[10px] sm:text-xs font-mono text-ink-500 tracking-wider">
            {filteredTasks.length}{filteredTasks.length !== tasks.length ? `/${tasks.length}` : ""} tarefas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`text-[10px] sm:text-xs font-mono tracking-wider uppercase px-3 py-1.5 border rounded-md transition-all duration-200 flex-shrink-0 flex items-center gap-1.5 ${
              activeFilterCount > 0
                ? "bg-signal-blue/10 text-signal-blue border-signal-blue/30 hover:bg-signal-blue/20"
                : "bg-ink-900/60 text-ink-400 border-ink-700/60 hover:text-ink-200 hover:border-ink-600"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M1.5 3h9M3 6h6M4.5 9h3" />
            </svg>
            Filtros
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-signal-blue/20 text-signal-blue text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[10px] sm:text-xs font-mono tracking-wider uppercase px-3 py-1.5 bg-amber-glow/10 text-amber-glow border border-amber-glow/20 rounded-md hover:bg-amber-glow/20 hover:border-amber-glow/40 transition-all duration-200 flex-shrink-0"
          >
            + Nova
          </button>
        </div>
      </div>

      {/* Status summary bar */}
      <div className="flex items-center gap-1 mb-4 sm:mb-5">
        {statusCounts.map((col) => (
          <div
            key={col.key}
            className="flex-1 h-1 rounded-full overflow-hidden bg-ink-800/30"
            title={`${col.label}: ${col.count}`}
          >
            {col.count > 0 && (
              <div className={`h-full rounded-full ${col.accent} opacity-70`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Project Ribbon ── */}
      <ProjectRibbon
        projects={projects ?? []}
        projectTaskCounts={projectTaskCounts}
        unassignedCount={unassignedCount}
        activeProjectId={filters.projectId}
        onFilter={handleProjectFilter}
        onCreate={createProject}
        onRemove={removeProject}
      />

      {/* Filter bar */}
      {showFilters && (
        <div className="mb-4 sm:mb-5 p-3 sm:p-4 border border-ink-800/50 rounded-lg bg-ink-900/40 animate-fade-in">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[9px] font-mono text-ink-600 uppercase tracking-widest mb-1 block">Busca</label>
              <input
                type="text"
                placeholder="Filtrar por título..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="w-full px-2.5 py-1.5 bg-ink-950 border border-ink-700/50 rounded text-[11px] sm:text-xs text-ink-200 placeholder:text-ink-600 focus:outline-none focus:border-amber-glow/30 transition-colors font-mono"
              />
            </div>
            <FilterSelect
              label="Prioridade"
              value={filters.priority}
              onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
              options={[
                { value: "", label: "Todas" },
                { value: "urgent", label: "Urgente" },
                { value: "high", label: "Alta" },
                { value: "medium", label: "Média" },
                { value: "low", label: "Baixa" },
              ]}
            />
            <FilterSelect
              label="Agente"
              value={filters.agentId}
              onChange={(v) => setFilters((f) => ({ ...f, agentId: v }))}
              options={[
                { value: "", label: "Todos" },
                ...agents.map((a) => ({ value: a._id, label: a.name })),
              ]}
            />
            <FilterSelect
              label="Entregáveis"
              value={filters.deliverables}
              onChange={(v) => setFilters((f) => ({ ...f, deliverables: v }))}
              options={[
                { value: "", label: "Todos" },
                { value: "with", label: "Com" },
                { value: "without", label: "Sem" },
              ]}
            />
            <FilterSelect
              label="Período"
              value={filters.period}
              onChange={(v) => setFilters((f) => ({ ...f, period: v }))}
              options={[
                { value: "", label: "Todas" },
                { value: "7d", label: "7 dias" },
                { value: "30d", label: "30 dias" },
              ]}
            />
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-[10px] font-mono text-ink-500 hover:text-signal-red transition-colors px-2 py-1.5 self-end"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}

      {/* New task form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-5 p-4 sm:p-5 border border-ink-700/60 rounded-lg bg-ink-900/60 space-y-3 animate-fade-in"
        >
          <input
            type="text"
            placeholder="Titulo da tarefa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 bg-ink-950 border border-ink-700/60 rounded-md text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-glow/40 focus:ring-1 focus:ring-amber-glow/10 transition-colors"
          />
          <textarea
            placeholder="Descricao (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-ink-950 border border-ink-700/60 rounded-md text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-glow/40 focus:ring-1 focus:ring-amber-glow/10 transition-colors resize-none"
            rows={2}
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["low", "medium", "high", "urgent"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`text-[10px] font-mono tracking-wider uppercase px-2 py-1 rounded border transition-all ${
                    priority === p
                      ? "bg-amber-glow/15 text-amber-glow border-amber-glow/30"
                      : "bg-transparent text-ink-500 border-ink-700 hover:border-ink-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {/* Project selector */}
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-[9px] font-mono text-ink-600 uppercase tracking-wider">Projeto:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedProjectForCreate("")}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                    !selectedProjectForCreate
                      ? "bg-ink-700/30 text-ink-300 border-ink-600/40"
                      : "text-ink-600 border-ink-800/30 hover:border-ink-700"
                  }`}
                >
                  nenhum
                </button>
                {(projects ?? []).map((p) => {
                  const pc = PROJECT_COLORS[p.color] ?? DEFAULT_PROJECT_COLOR;
                  const isSelected = selectedProjectForCreate === p._id;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => setSelectedProjectForCreate(p._id)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all inline-flex items-center gap-1 ${
                        isSelected
                          ? `${pc.bg} ${pc.text} border-current/20 ring-1 ${pc.ring}`
                          : "text-ink-500 border-ink-800/30 hover:border-ink-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[10px] font-mono text-ink-500 hover:text-ink-300 transition-colors px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-[10px] font-mono tracking-wider uppercase px-4 py-1.5 bg-amber-glow text-ink-950 rounded-md hover:bg-amber-dim transition-colors font-semibold"
            >
              Criar
            </button>
          </div>
        </form>
      )}

      {/* Kanban columns — stacked vertically, collapsible */}
      <div className="space-y-2">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key);
          const isEmpty = colTasks.length === 0;
          const isDone = col.key === "done";
          const isCollapsed = collapsedCols.has(col.key);
          const visibleTasks = isDone && !expandedDone && !isCollapsed
            ? colTasks.slice(0, DONE_PREVIEW_COUNT)
            : isCollapsed ? [] : colTasks;
          const hiddenCount = isDone && !expandedDone ? Math.max(0, colTasks.length - DONE_PREVIEW_COUNT) : 0;

          return (
            <div
              key={col.key}
              className={`border rounded-lg transition-all duration-300 ${
                isEmpty
                  ? "border-ink-800/20 bg-ink-900/10"
                  : "border-ink-800/40 bg-ink-900/30"
              }`}
            >
              {/* Column header */}
              <button
                onClick={() => !isEmpty && toggleCollapse(col.key)}
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2.5 transition-colors ${
                  isEmpty ? "cursor-default" : "cursor-pointer hover:bg-ink-800/20"
                } ${isCollapsed ? "" : colTasks.length > 0 ? "border-b border-ink-800/30" : ""}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${col.accent} ${isEmpty ? "opacity-30" : ""}`} />
                <h3 className={`text-[10px] font-mono font-semibold uppercase tracking-widest flex-1 text-left ${
                  isEmpty ? "text-ink-700" : "text-ink-400"
                }`}>
                  {col.label}
                </h3>
                <span className={`text-[10px] font-mono tabular-nums ${
                  isEmpty ? "text-ink-800" : colTasks.length > 0 ? col.accentText + " opacity-70" : "text-ink-600"
                }`}>
                  {colTasks.length}
                </span>
                {!isEmpty && (
                  <span className={`text-ink-600 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                      <path d="M2.5 3.5L5 6L7.5 3.5" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Cards */}
              {!isCollapsed && visibleTasks.length > 0 && (
                <div className="p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {visibleTasks.map((task, i) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      assignees={task.assigneeIds
                        .map((id: Id<"agents">) => agentMap.get(id) ?? "?")
                        .join(", ")}
                      index={i}
                      compact={isDone}
                      hasDoc={taskIdsWithDocs.has(task._id)}
                      project={task.projectId ? projectMap.get(task.projectId) : undefined}
                      onSelect={() => setSelectedTaskId(task._id)}
                    />
                  ))}
                </div>
              )}

              {/* Show more for done */}
              {isDone && !isCollapsed && hiddenCount > 0 && (
                <div className="px-3 sm:px-4 pb-2.5">
                  <button
                    onClick={() => setExpandedDone(true)}
                    className="w-full py-1.5 text-[10px] font-mono text-ink-500 hover:text-ink-300 transition-colors tracking-wider"
                  >
                    + {hiddenCount} concluída{hiddenCount > 1 ? "s" : ""} — mostrar todas
                  </button>
                </div>
              )}
              {isDone && !isCollapsed && expandedDone && colTasks.length > DONE_PREVIEW_COUNT && (
                <div className="px-3 sm:px-4 pb-2.5">
                  <button
                    onClick={() => setExpandedDone(false)}
                    className="w-full py-1.5 text-[10px] font-mono text-ink-500 hover:text-ink-300 transition-colors tracking-wider"
                  >
                    recolher
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task detail sheet */}
      <TaskDetailSheet
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        agentMap={agentMap}
        projectMap={projectMap}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
/*  Project Ribbon                                                         */
/*  Persistent horizontal strip: project pills + inline create             */
/* ════════════════════════════════════════════════════════════════════════ */

function ProjectRibbon({
  projects,
  projectTaskCounts,
  unassignedCount,
  activeProjectId,
  onFilter,
  onCreate,
  onRemove,
}: {
  projects: { _id: string; name: string; color: string; _creationTime?: number }[];
  projectTaskCounts: Map<string, number>;
  unassignedCount: number;
  activeProjectId: string;
  onFilter: (id: string) => void;
  onCreate: (args: { name: string; color: string }) => Promise<unknown>;
  onRemove: (args: { id: Id<"projects"> }) => Promise<unknown>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) inputRef.current.focus();
  }, [isCreating]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    function handleClick(e: MouseEvent) {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);

  async function handleCreate() {
    if (!newName.trim()) return;
    await onCreate({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor("blue");
    setIsCreating(false);
  }

  return (
    <div className="mb-4 sm:mb-5">
      {/* Label + pills row */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[9px] font-mono text-ink-600 uppercase tracking-widest flex-shrink-0">
          Projetos
        </span>
        <div className="h-px flex-1 bg-ink-800/30" />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-2">
        {/* "All" pill — clears project filter */}
        <button
          onClick={() => onFilter("")}
          className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all duration-200 ${
            !activeProjectId
              ? "bg-ink-700/30 text-ink-200 border-ink-600/40"
              : "text-ink-600 border-ink-800/30 hover:border-ink-700 hover:text-ink-400"
          }`}
        >
          Todos
        </button>

        {/* "Unassigned" pill */}
        <button
          onClick={() => onFilter("_none")}
          className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all duration-200 inline-flex items-center gap-1.5 ${
            activeProjectId === "_none"
              ? "bg-ink-700/30 text-ink-200 border-ink-600/40"
              : "text-ink-600 border-ink-800/30 hover:border-ink-700 hover:text-ink-400"
          }`}
        >
          Sem projeto
          <span className="text-[9px] font-mono text-ink-700 tabular-nums">{unassignedCount}</span>
        </button>

        {/* Project pills */}
        {projects.map((p) => {
          const pc = PROJECT_COLORS[p.color] ?? DEFAULT_PROJECT_COLOR;
          const isActive = activeProjectId === p._id;
          const count = projectTaskCounts.get(p._id) ?? 0;

          return (
            <div key={p._id} className="relative">
              <button
                onClick={() => onFilter(p._id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu(contextMenu === p._id ? null : p._id);
                }}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all duration-200 inline-flex items-center gap-1.5 group ${
                  isActive
                    ? `${pc.bg} ${pc.text} border-current/20 ring-1 ${pc.ring}`
                    : `text-ink-500 border-ink-800/40 hover:border-ink-700 hover:${pc.text}`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${pc.dot} ${isActive ? "" : "opacity-60 group-hover:opacity-100"} transition-opacity`} />
                {p.name}
                <span className={`text-[9px] tabular-nums ${isActive ? "opacity-60" : "text-ink-700"}`}>{count}</span>
              </button>

              {/* Context menu (right-click) */}
              {contextMenu === p._id && (
                <div
                  ref={contextRef}
                  className="absolute top-full left-0 mt-1 z-30 bg-ink-900 border border-ink-700/60 rounded-md shadow-xl shadow-black/40 overflow-hidden animate-fade-in"
                >
                  <button
                    onClick={() => {
                      onRemove({ id: p._id as Id<"projects"> });
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-signal-red hover:bg-signal-red/10 transition-colors whitespace-nowrap"
                  >
                    Remover projeto
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Inline create */}
        {isCreating ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
            className="inline-flex items-center gap-1.5 animate-fade-in"
          >
            {/* Color picker dots */}
            <div className="flex items-center gap-0.5">
              {COLOR_PRESETS.map((c) => {
                const pc = PROJECT_COLORS[c.value] ?? DEFAULT_PROJECT_COLOR;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewColor(c.value)}
                    className={`w-3.5 h-3.5 rounded-full transition-all ${pc.dot} ${
                      newColor === c.value
                        ? "ring-1 ring-offset-1 ring-offset-ink-950 ring-ink-400 scale-110"
                        : "opacity-40 hover:opacity-70"
                    }`}
                    title={c.label}
                  />
                );
              })}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome..."
              onKeyDown={(e) => { if (e.key === "Escape") { setIsCreating(false); setNewName(""); } }}
              className="px-2 py-0.5 bg-ink-950 border border-ink-700/50 rounded-full text-[10px] text-ink-200 placeholder:text-ink-600 focus:outline-none focus:border-amber-glow/30 transition-colors font-mono w-28"
            />
            <button
              type="submit"
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-glow/15 text-amber-glow border border-amber-glow/20 hover:bg-amber-glow/25 transition-colors"
            >
              ok
            </button>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setNewName(""); }}
              className="text-ink-600 hover:text-ink-400 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
              </svg>
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="text-[10px] font-mono px-2 py-1 rounded-full border border-dashed border-ink-700/40 text-ink-600 hover:text-ink-400 hover:border-ink-600 transition-all duration-200 inline-flex items-center gap-1"
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M4.5 1.5v6M1.5 4.5h6" />
            </svg>
            novo
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
/*  Filter Select                                                          */
/* ════════════════════════════════════════════════════════════════════════ */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[9px] font-mono text-ink-600 uppercase tracking-widest mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 bg-ink-950 border border-ink-700/50 rounded text-[11px] sm:text-xs text-ink-200 focus:outline-none focus:border-amber-glow/30 transition-colors font-mono appearance-none pr-6 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
/*  Task Card                                                              */
/* ════════════════════════════════════════════════════════════════════════ */

function TaskCard({
  task,
  assignees,
  index,
  compact,
  hasDoc,
  project,
  onSelect,
}: {
  task: { _id: string; title: string; priority: string; description: string };
  assignees: string;
  index: number;
  compact?: boolean;
  hasDoc?: boolean;
  project?: { name: string; color: string };
  onSelect: () => void;
}) {
  const prioConfig = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const pc = project ? (PROJECT_COLORS[project.color] ?? DEFAULT_PROJECT_COLOR) : null;

  return (
    <div
      className={`border rounded-md cursor-pointer transition-all duration-200 animate-fade-in group ${
        compact
          ? "bg-ink-950/40 border-ink-800/30 p-2 hover:border-ink-700/50 hover:bg-ink-900/40"
          : "bg-ink-900/60 border-ink-800/50 p-2.5 hover:border-ink-600/60 hover:bg-ink-800/40"
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${prioConfig.dot} ${compact ? "opacity-50" : ""}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium leading-snug group-hover:text-ink-50 transition-colors ${
            compact ? "text-[10px] text-ink-400" : "text-[11px] sm:text-xs text-ink-200"
          }`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {assignees && (
              <span className={`font-mono truncate ${compact ? "text-[9px] text-ink-700" : "text-[10px] text-ink-600"}`}>
                {assignees}
              </span>
            )}
            {pc && project && (
              <span className={`inline-flex items-center gap-1 text-[9px] font-mono ${pc.text} opacity-70`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                {project.name}
              </span>
            )}
            {hasDoc && (
              <span className="text-[9px] font-mono text-signal-green/50" title="Tem entregáveis">
                ◆
              </span>
            )}
          </div>
        </div>
        <span className="text-ink-700 group-hover:text-ink-500 transition-colors mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M3.5 2L7 5L3.5 8" />
          </svg>
        </span>
      </div>
    </div>
  );
}
