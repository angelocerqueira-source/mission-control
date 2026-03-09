"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/* ------------------------------------------------------------------ */
/*  Styled Markdown renderer — dark ops theme                          */
/*                                                                     */
/*  Renders markdown strings with full GFM support (tables, tasks,     */
/*  strikethrough) styled for the Mission Control ink/amber palette.   */
/* ------------------------------------------------------------------ */

const components: Components = {
  /* Headings — Playfair Display with amber accents on h1/h2 */
  h1: ({ children }) => (
    <h1 className="font-[family-name:var(--font-display)] text-lg font-bold text-ink-50 mb-3 mt-6 first:mt-0 pb-2 border-b border-ink-800/50">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-ink-100 mb-2.5 mt-5 first:mt-0 pb-1.5 border-b border-ink-800/30">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-100 mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-[13px] font-semibold text-ink-200 mb-1.5 mt-3 first:mt-0 uppercase tracking-wider font-mono">
      {children}
    </h4>
  ),

  /* Paragraphs */
  p: ({ children }) => (
    <p className="text-[13px] text-ink-300 leading-relaxed mb-3 last:mb-0">
      {children}
    </p>
  ),

  /* Lists */
  ul: ({ children }) => (
    <ul className="text-[13px] text-ink-300 leading-relaxed mb-3 pl-4 space-y-1 list-none">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-[13px] text-ink-300 leading-relaxed mb-3 pl-4 space-y-1 list-none counter-reset-[item]">
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => {
    const isOrdered = (props as Record<string, unknown>).ordered;
    return (
      <li className="relative pl-4">
        <span
          className={`absolute left-0 top-0 text-amber-glow/60 text-[11px] font-mono select-none ${isOrdered ? "counter-increment-[item] before:content-[counter(item)'.']" : ""}`}
        >
          {isOrdered ? null : "▸"}
        </span>
        {children}
      </li>
    );
  },

  /* Inline code */
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={`${className ?? ""} text-[12px]`}>{children}</code>
      );
    }
    return (
      <code className="text-[12px] font-mono text-amber-glow bg-amber-glow/8 border border-amber-glow/12 px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },

  /* Code blocks */
  pre: ({ children }) => (
    <pre className="text-[12px] font-mono text-ink-300 bg-ink-950 border border-ink-800/50 rounded-lg px-4 py-3 mb-3 overflow-x-auto leading-relaxed">
      {children}
    </pre>
  ),

  /* Blockquote — left amber bar */
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-amber-glow/40 pl-4 py-0.5 mb-3 bg-amber-glow/[0.03] rounded-r-md">
      {children}
    </blockquote>
  ),

  /* Links */
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-signal-blue hover:text-signal-blue/80 underline underline-offset-2 decoration-signal-blue/30 hover:decoration-signal-blue/60 transition-colors"
    >
      {children}
    </a>
  ),

  /* Strong / emphasis */
  strong: ({ children }) => (
    <strong className="font-semibold text-ink-100">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-ink-200">{children}</em>
  ),

  /* Horizontal rule */
  hr: () => (
    <hr className="border-none h-px bg-ink-800/50 my-4" />
  ),

  /* Tables — ops-grade data grid */
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-lg border border-ink-800/40">
      <table className="w-full text-[12px] font-mono">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-ink-900/60 border-b border-ink-800/50">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-ink-800/20 last:border-0 hover:bg-ink-800/15 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="text-left text-[10px] tracking-wider uppercase text-ink-500 px-3 py-2 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="text-ink-300 px-3 py-2">{children}</td>
  ),

  /* Images — constrained with rounded border */
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="max-w-full rounded-lg border border-ink-800/40 my-3"
    />
  ),
};

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

interface MarkdownProseProps {
  content: string;
  /** Compact mode reduces font sizes and spacing for card previews */
  compact?: boolean;
  className?: string;
}

export function MarkdownProse({
  content,
  compact = false,
  className = "",
}: MarkdownProseProps) {
  if (!content) return null;

  return (
    <div
      className={`
        ${compact ? "mc-prose-compact" : "mc-prose"}
        ${className}
      `}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Truncated markdown preview — renders first N chars with fade.
 * Used for task cards in the kanban board.
 */
export function MarkdownPreview({
  content,
  maxLength = 180,
  className = "",
}: {
  content: string;
  maxLength?: number;
  className?: string;
}) {
  if (!content) return null;

  const truncated =
    content.length > maxLength
      ? content.slice(0, maxLength).trimEnd() + "…"
      : content;

  return (
    <div className={`mc-prose-compact relative ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {truncated}
      </ReactMarkdown>
      {content.length > maxLength && (
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-ink-900/90 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
