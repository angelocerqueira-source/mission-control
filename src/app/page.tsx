"use client";

import { AgentCards } from "../components/agent-cards";
import { ActivityFeed } from "../components/activity-feed";
import { TaskBoard } from "../components/task-board";

export default function Home() {
  return (
    <div className="min-h-screen min-h-dvh">
      {/* Header */}
      <header className="border-b border-ink-800/60 bg-ink-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 flex items-center sm:items-end justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-lg sm:text-2xl font-bold text-ink-50 tracking-tight truncate">
              Mission Control
            </h1>
            <span className="text-ink-500 text-[10px] sm:text-xs font-mono tracking-widest uppercase hidden sm:inline">
              OpenClaw / 10 Agents
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
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-10">
        {/* Agents Section */}
        <section className="animate-fade-in" style={{ animationDelay: "0ms" }}>
          <SectionHeader title="Equipe" subtitle="Status dos agentes" />
          <AgentCards />
        </section>

        {/* Divider */}
        <div className="border-t border-ink-800/40" />

        {/* Task Board */}
        <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <TaskBoard />
        </section>

        {/* Divider */}
        <div className="border-t border-ink-800/40" />

        {/* Activity Feed */}
        <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <SectionHeader title="Activity Feed" subtitle="Tempo real" />
          <ActivityFeed />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-800/30 mt-8 sm:mt-12 py-4 sm:py-6 safe-bottom">
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

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
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
