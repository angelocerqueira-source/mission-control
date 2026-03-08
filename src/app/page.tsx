"use client";

import { useState } from "react";
import { AgentCards } from "../components/agent-cards";
import { ActivityFeed } from "../components/activity-feed";
import { TaskBoard } from "../components/task-board";
import { DocumentPanel } from "../components/document-panel";
import { TokenUsage } from "../components/token-usage";
import { OverviewPanel } from "../components/overview-panel";

type Tab = "overview" | "agents" | "tasks" | "intel" | "tokens";

const TABS: { id: Tab; label: string; shortcut: string }[] = [
  { id: "overview", label: "Overview", shortcut: "1" },
  { id: "agents", label: "Agents", shortcut: "2" },
  { id: "tasks", label: "Tasks", shortcut: "3" },
  { id: "intel", label: "Intel", shortcut: "4" },
  { id: "tokens", label: "Tokens", shortcut: "5" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen min-h-dvh flex flex-col">
      {/* Header + Navigation */}
      <header className="border-b border-ink-800/60 bg-ink-950/80 backdrop-blur-sm sticky top-0 z-40">
        {/* Top bar */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-0 flex items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-lg sm:text-2xl font-bold text-ink-50 tracking-tight truncate">
              Mission Control
            </h1>
            <span className="text-ink-500 text-[10px] sm:text-xs font-mono tracking-widest uppercase hidden sm:inline">
              OpenClaw / 12 Agents
            </span>
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
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 bg-signal-green rounded-full animate-pulse-glow" />
              <span className="text-[10px] sm:text-xs font-mono text-signal-green tracking-wider uppercase">
                Live
              </span>
            </div>
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
                        ? "text-amber-glow border-amber-glow"
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
          {activeTab === "overview" && <OverviewView />}
          {activeTab === "agents" && <AgentsView />}
          {activeTab === "tasks" && <TasksView />}
          {activeTab === "intel" && <IntelView />}
          {activeTab === "tokens" && <TokensView />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-800/30 py-4 sm:py-6 safe-bottom mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-mono text-ink-600">
            mission-control v0.1.0
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-ink-600">
            convex: third-cardinal-694
          </span>
        </div>
      </footer>
    </div>
  );
}

/* --- Tab Views --- */

function OverviewView() {
  return <OverviewPanel />;
}

function AgentsView() {
  return (
    <section>
      <SectionHeader title="Equipe" subtitle="Status dos agentes" />
      <AgentCards />
    </section>
  );
}

function TasksView() {
  return (
    <section>
      <TaskBoard />
    </section>
  );
}

function IntelView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      <section>
        <SectionHeader title="Documentos" subtitle="Deliverables e pesquisas" />
        <DocumentPanel />
      </section>
      <section>
        <SectionHeader title="Activity Feed" subtitle="Tempo real" />
        <ActivityFeed />
      </section>
    </div>
  );
}

function TokensView() {
  return (
    <section>
      <SectionHeader title="Token Usage" subtitle="Consumo por agente" />
      <TokenUsage />
    </section>
  );
}

/* --- Shared --- */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-5">
      <h2 className="font-[family-name:var(--font-display)] text-base sm:text-lg font-semibold text-ink-100">
        {title}
      </h2>
      <span className="text-[10px] sm:text-xs font-mono text-ink-500 tracking-wider">
        {subtitle}
      </span>
    </div>
  );
}
