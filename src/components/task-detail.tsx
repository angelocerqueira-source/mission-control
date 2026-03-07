"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

export function TaskDetail({ taskId, onClose }: { taskId: Id<"tasks">; onClose: () => void }) {
  const tasks = useQuery(api.tasks.list);
  const messages = useQuery(api.messages.listByTask, { taskId });
  const documents = useQuery(api.documents.listByTask, { taskId });
  const agents = useQuery(api.agents.list);
  const createMessage = useMutation(api.messages.create);
  const [comment, setComment] = useState("");

  const task = tasks?.find((t) => t._id === taskId);
  if (!task) return null;

  const agentMap = new Map(agents?.map((a) => [a._id, a.name]) ?? []);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !agents?.length) return;
    await createMessage({
      taskId,
      fromAgentId: agents[0]._id,
      content: comment.trim(),
    });
    setComment("");
  }

  return (
    <div
      className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-ink-900 border-t sm:border border-ink-700/60 sm:rounded-xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto shadow-2xl shadow-black/40 rounded-t-2xl sm:rounded-xl safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex sm:hidden justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-ink-700" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-ink-800/60">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-[family-name:var(--font-display)] text-base sm:text-lg font-semibold text-ink-50">
                {task.title}
              </h2>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded border border-ink-700 text-ink-400">
                  {task.status.replace("_", " ")}
                </span>
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded border border-ink-700 text-ink-400">
                  {task.priority}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md text-ink-500 hover:text-ink-200 hover:bg-ink-800 transition-colors flex-shrink-0"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {task.description && (
            <p className="text-xs sm:text-sm text-ink-300 leading-relaxed">{task.description}</p>
          )}

          {task.assigneeIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-ink-600 uppercase tracking-wider">Atribuido:</span>
              {task.assigneeIds.map((id: Id<"agents">) => (
                <span
                  key={id}
                  className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-amber-glow/10 text-amber-glow border border-amber-glow/20"
                >
                  {agentMap.get(id) ?? "?"}
                </span>
              ))}
            </div>
          )}

          {/* Documents */}
          {documents && documents.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono text-ink-500 uppercase tracking-widest mb-2">
                Documentos
              </h3>
              <div className="space-y-1.5">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-md bg-ink-800/40 border border-ink-700/40"
                  >
                    <span className="text-xs font-mono text-signal-purple">~</span>
                    <span className="text-[11px] sm:text-xs text-ink-200 font-medium truncate">{doc.title}</span>
                    <span className="text-[10px] font-mono text-ink-600 flex-shrink-0">{doc.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-ink-800/50 pt-4 sm:pt-5">
            <h3 className="text-[10px] font-mono text-ink-500 uppercase tracking-widest mb-3">
              Comentarios
            </h3>
            <div className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4 max-h-[180px] sm:max-h-[220px] overflow-y-auto">
              {messages?.map((msg) => (
                <div key={msg._id} className="px-3 py-2 sm:py-2.5 rounded-md bg-ink-800/30 border border-ink-800/40">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] sm:text-xs font-semibold text-amber-glow/80">
                      {agentMap.get(msg.fromAgentId) ?? "?"}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-ink-600 tabular-nums">
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-ink-300 leading-relaxed">{msg.content}</p>
                </div>
              ))}
              {(!messages || messages.length === 0) && (
                <p className="text-[11px] sm:text-xs font-mono text-ink-600 italic">
                  Sem comentarios ainda.
                </p>
              )}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                placeholder="@nome para mencionar"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 bg-ink-950 border border-ink-700/60 rounded-md text-xs sm:text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none focus:border-amber-glow/40 focus:ring-1 focus:ring-amber-glow/10 transition-colors min-w-0"
              />
              <button
                type="submit"
                className="text-[10px] sm:text-xs font-mono tracking-wider uppercase px-3 sm:px-4 py-2 bg-amber-glow text-ink-950 rounded-md hover:bg-amber-dim transition-colors font-semibold flex-shrink-0"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
