"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const IDLE_THRESHOLD_MS = 20 * 60 * 1000;

function getEffectiveStatus(agent: {
  status: string;
  lastActiveAt?: number;
}): "idle" | "active" | "blocked" {
  if (agent.status === "blocked") return "blocked";
  if (!agent.lastActiveAt) return "idle";
  const elapsed = Date.now() - agent.lastActiveAt;
  if (agent.status === "active" && elapsed > IDLE_THRESHOLD_MS) return "idle";
  return agent.status as "idle" | "active" | "blocked";
}

export function OverviewPanel() {
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const activities = useQuery(api.activities.list, { limit: 8 });

  const isLoading = !agents || !tasks || !activities;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 sm:h-24 bg-ink-900/40 border border-ink-800/60 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="h-40 bg-ink-900/40 border border-ink-800/60 rounded-lg animate-pulse" />
      </div>
    );
  }

  const onlineCount = agents.filter(
    (a) => getEffectiveStatus(a) === "active"
  ).length;
  const blockedCount = agents.filter(
    (a) => getEffectiveStatus(a) === "blocked"
  ).length;

  const tasksByStatus = {
    inbox: tasks.filter((t) => t.status === "inbox").length,
    assigned: tasks.filter((t) => t.status === "assigned").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  };

  const activeTasks = tasksByStatus.in_progress + tasksByStatus.assigned;
  const totalTasks = tasks.length;

  const TYPE_ICON: Record<string, { icon: string; color: string }> = {
    task_created: { icon: "+", color: "text-signal-blue" },
    message_sent: { icon: "#", color: "text-ink-400" },
    document_created: { icon: "~", color: "text-signal-purple" },
    status_changed: { icon: ">", color: "text-signal-amber" },
    agent_woke: { icon: "*", color: "text-signal-green" },
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Agents Online"
          value={`${onlineCount}`}
          total={`/ ${agents.length}`}
          accent={onlineCount > 0 ? "green" : "dim"}
        />
        <StatCard
          label="Tasks Ativas"
          value={`${activeTasks}`}
          total={`/ ${totalTasks}`}
          accent={activeTasks > 0 ? "amber" : "dim"}
        />
        <StatCard
          label="Concluídas"
          value={`${tasksByStatus.done}`}
          accent={tasksByStatus.done > 0 ? "blue" : "dim"}
        />
        <StatCard
          label="Bloqueadas"
          value={`${tasksByStatus.blocked + blockedCount}`}
          accent={tasksByStatus.blocked + blockedCount > 0 ? "red" : "dim"}
        />
      </div>

      {/* Two-column: Agents + Tasks pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Agent roster compact */}
        <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-4 sm:p-5">
          <h3 className="text-[11px] sm:text-xs font-mono text-ink-500 tracking-wider uppercase mb-3 sm:mb-4">
            Equipe
          </h3>
          <div className="space-y-1.5">
            {agents.map((agent) => {
              const status = getEffectiveStatus(agent);
              const statusColor =
                status === "active"
                  ? "bg-signal-green"
                  : status === "blocked"
                    ? "bg-signal-red"
                    : "bg-ink-600";
              const agentTasks = tasks.filter(
                (t) =>
                  t.assigneeIds.includes(agent._id) &&
                  (t.status === "in_progress" || t.status === "assigned")
              );
              return (
                <div
                  key={agent._id}
                  className="flex items-center gap-2.5 py-1.5 px-2 rounded hover:bg-ink-800/30 transition-colors"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`}
                  />
                  <span className="text-xs sm:text-sm text-ink-200 truncate flex-1">
                    {agent.name}
                  </span>
                  <span className="text-[10px] font-mono text-ink-500 flex-shrink-0">
                    {agent.role}
                  </span>
                  {agentTasks.length > 0 && (
                    <span className="text-[10px] font-mono text-amber-glow bg-amber-glow/10 px-1.5 py-0.5 rounded flex-shrink-0">
                      {agentTasks.length} task
                      {agentTasks.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Task pipeline */}
        <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-4 sm:p-5">
          <h3 className="text-[11px] sm:text-xs font-mono text-ink-500 tracking-wider uppercase mb-3 sm:mb-4">
            Pipeline
          </h3>
          <div className="space-y-2.5">
            <PipelineRow
              label="Inbox"
              count={tasksByStatus.inbox}
              total={totalTasks}
              color="bg-ink-500"
            />
            <PipelineRow
              label="Assigned"
              count={tasksByStatus.assigned}
              total={totalTasks}
              color="bg-signal-blue"
            />
            <PipelineRow
              label="In Progress"
              count={tasksByStatus.in_progress}
              total={totalTasks}
              color="bg-signal-amber"
            />
            <PipelineRow
              label="Review"
              count={tasksByStatus.review}
              total={totalTasks}
              color="bg-signal-purple"
            />
            <PipelineRow
              label="Done"
              count={tasksByStatus.done}
              total={totalTasks}
              color="bg-signal-green"
            />
            <PipelineRow
              label="Blocked"
              count={tasksByStatus.blocked}
              total={totalTasks}
              color="bg-signal-red"
            />
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-ink-900/40 border border-ink-800/60 rounded-lg p-4 sm:p-5">
        <h3 className="text-[11px] sm:text-xs font-mono text-ink-500 tracking-wider uppercase mb-3 sm:mb-4">
          Atividade Recente
        </h3>
        {activities.length === 0 ? (
          <p className="text-xs font-mono text-ink-600">
            Nenhuma atividade registrada.
          </p>
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => {
              const config = TYPE_ICON[activity.type] || {
                icon: "?",
                color: "text-ink-500",
              };
              return (
                <div
                  key={activity._id}
                  className="flex items-start gap-2.5 py-1 group"
                >
                  <span
                    className={`font-mono text-xs w-4 text-center flex-shrink-0 ${config.color}`}
                  >
                    {config.icon}
                  </span>
                  <span className="text-xs text-ink-300 flex-1 truncate">
                    {activity.message}
                  </span>
                  <time className="text-[10px] font-mono text-ink-600 flex-shrink-0">
                    {new Date(activity.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  accent,
}: {
  label: string;
  value: string;
  total?: string;
  accent: "green" | "amber" | "blue" | "red" | "dim";
}) {
  const accentColors = {
    green: "text-signal-green",
    amber: "text-amber-glow",
    blue: "text-signal-blue",
    red: "text-signal-red",
    dim: "text-ink-400",
  };

  const borderColors = {
    green: "border-signal-green/20",
    amber: "border-amber-glow/20",
    blue: "border-signal-blue/20",
    red: "border-signal-red/20",
    dim: "border-ink-800/60",
  };

  return (
    <div
      className={`bg-ink-900/40 border ${borderColors[accent]} rounded-lg p-3 sm:p-4`}
    >
      <p className="text-[10px] sm:text-[11px] font-mono text-ink-500 tracking-wider uppercase mb-1.5">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-xl sm:text-2xl font-[family-name:var(--font-display)] font-bold ${accentColors[accent]}`}
        >
          {value}
        </span>
        {total && (
          <span className="text-xs sm:text-sm font-mono text-ink-600">
            {total}
          </span>
        )}
      </div>
    </div>
  );
}

function PipelineRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] sm:text-xs font-mono text-ink-400 w-24 sm:w-28 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-ink-800/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
        />
      </div>
      <span className="text-[11px] sm:text-xs font-mono text-ink-500 w-6 text-right flex-shrink-0">
        {count}
      </span>
    </div>
  );
}
