"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const IDLE_THRESHOLD_MS = 20 * 60 * 1000;

export default function SpaceSelector() {
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const contentRuns = useQuery(api.contentRuns.list);

  const onlineAgents = agents?.filter((a) => {
    if (a.status === "blocked") return false;
    if (!a.lastActiveAt) return false;
    return a.status === "active" && Date.now() - a.lastActiveAt < IDLE_THRESHOLD_MS;
  }).length ?? 0;

  const activeTasks =
    tasks?.filter((t) => t.status === "in_progress" || t.status === "assigned")
      .length ?? 0;

  const totalRuns = contentRuns?.length ?? 0;
  const activeRuns =
    contentRuns?.filter(
      (r) =>
        r.status === "researching" ||
        r.status === "generating" ||
        r.status === "adapting"
    ).length ?? 0;
  const publishedRuns =
    contentRuns?.filter((r) => r.status === "published").length ?? 0;
  const lastRun = contentRuns?.[0];

  return (
    <div className="min-h-screen min-h-dvh flex flex-col">
      {/* Cinematic header */}
      <header className="pt-12 sm:pt-20 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-1.5 h-1.5 bg-signal-green rounded-full animate-pulse-glow" />
            <span className="text-[10px] sm:text-xs font-mono text-signal-green tracking-[0.25em] uppercase">
              Online
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl lg:text-6xl font-black text-ink-50 tracking-tight leading-[1.1]">
            Mission Control
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-ink-500 font-mono">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </header>

      {/* Space cards */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        <div className="max-w-[900px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Ops Center */}
          <Link href="/ops" className="group block">
            <div className="relative overflow-hidden rounded-xl border border-ink-800/60 bg-ink-900/50 p-6 sm:p-8 transition-all duration-300 group-hover:border-amber-glow/40 group-hover:bg-ink-900/70 h-full">
              {/* Geometric accent */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <circle cx="80" cy="20" r="40" stroke="currentColor" strokeWidth="0.5" className="text-amber-glow" />
                  <circle cx="80" cy="20" r="25" stroke="currentColor" strokeWidth="0.5" className="text-amber-glow" />
                  <circle cx="80" cy="20" r="12" stroke="currentColor" strokeWidth="0.5" className="text-amber-glow" />
                </svg>
              </div>

              {/* Icon */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-amber-glow/10 border border-amber-glow/20 flex items-center justify-center mb-5 sm:mb-6 group-hover:border-amber-glow/40 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-glow sm:w-6 sm:h-6">
                  <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>

              <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-ink-100 mb-2 group-hover:text-ink-50 transition-colors">
                Ops Center
              </h2>
              <p className="text-xs sm:text-sm text-ink-500 mb-6 sm:mb-8 leading-relaxed">
                Coordenacao de agentes, tasks, documentos e tokens. O hub central do time.
              </p>

              {/* Stats */}
              <div className="flex gap-6 sm:gap-8">
                <div>
                  <p className="text-[10px] font-mono text-ink-600 tracking-wider uppercase mb-0.5">Agents</p>
                  <p className="text-lg sm:text-xl font-[family-name:var(--font-display)] font-bold text-signal-green">
                    {onlineAgents}
                    <span className="text-xs sm:text-sm font-mono text-ink-600 ml-1">/ {agents?.length ?? 0}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-ink-600 tracking-wider uppercase mb-0.5">Tasks</p>
                  <p className="text-lg sm:text-xl font-[family-name:var(--font-display)] font-bold text-amber-glow">
                    {activeTasks}
                    <span className="text-xs sm:text-sm font-mono text-ink-600 ml-1">ativas</span>
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 text-ink-700 group-hover:text-amber-glow transition-all duration-300 group-hover:translate-x-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Content Studio */}
          <Link href="/content" className="group block">
            <div className="relative overflow-hidden rounded-xl border border-ink-800/60 bg-ink-900/50 p-6 sm:p-8 transition-all duration-300 group-hover:border-signal-purple/40 group-hover:bg-ink-900/70 h-full">
              {/* Geometric accent */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                  <rect x="55" y="-5" width="40" height="40" rx="2" stroke="currentColor" strokeWidth="0.5" className="text-signal-purple" transform="rotate(15 75 15)" />
                  <rect x="60" y="0" width="28" height="28" rx="2" stroke="currentColor" strokeWidth="0.5" className="text-signal-purple" transform="rotate(15 74 14)" />
                  <rect x="65" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="0.5" className="text-signal-purple" transform="rotate(15 73 13)" />
                </svg>
              </div>

              {/* Icon */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-signal-purple/10 border border-signal-purple/20 flex items-center justify-center mb-5 sm:mb-6 group-hover:border-signal-purple/40 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-signal-purple sm:w-6 sm:h-6">
                  <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                  <path d="M7 8h10M7 12h6M7 16h8" strokeLinecap="round" />
                </svg>
              </div>

              <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-ink-100 mb-2 group-hover:text-ink-50 transition-colors">
                Content Studio
              </h2>
              <p className="text-xs sm:text-sm text-ink-500 mb-6 sm:mb-8 leading-relaxed">
                Pipeline editorial. Pesquisa, geracao, adaptacao e publicacao em 4 plataformas.
              </p>

              {/* Stats */}
              <div className="flex gap-6 sm:gap-8">
                <div>
                  <p className="text-[10px] font-mono text-ink-600 tracking-wider uppercase mb-0.5">Pipeline</p>
                  <p className="text-lg sm:text-xl font-[family-name:var(--font-display)] font-bold text-signal-purple">
                    {activeRuns > 0 ? activeRuns : publishedRuns}
                    <span className="text-xs sm:text-sm font-mono text-ink-600 ml-1">
                      {activeRuns > 0 ? "em exec" : "publicados"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-ink-600 tracking-wider uppercase mb-0.5">Total</p>
                  <p className="text-lg sm:text-xl font-[family-name:var(--font-display)] font-bold text-ink-400">
                    {totalRuns}
                    <span className="text-xs sm:text-sm font-mono text-ink-600 ml-1">runs</span>
                  </p>
                </div>
              </div>

              {/* Last run indicator */}
              {lastRun && (
                <div className="mt-4 pt-4 border-t border-ink-800/40">
                  <p className="text-[10px] font-mono text-ink-600 truncate">
                    <span className="text-ink-500">ultimo:</span>{" "}
                    {lastRun.tema}
                  </p>
                </div>
              )}

              {/* Arrow */}
              <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 text-ink-700 group-hover:text-signal-purple transition-all duration-300 group-hover:translate-x-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-800/30 py-4 sm:py-6 safe-bottom mt-auto">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-mono text-ink-600">
            mission-control v0.2.0
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-ink-600">
            convex: third-cardinal-694
          </span>
        </div>
      </footer>
    </div>
  );
}
