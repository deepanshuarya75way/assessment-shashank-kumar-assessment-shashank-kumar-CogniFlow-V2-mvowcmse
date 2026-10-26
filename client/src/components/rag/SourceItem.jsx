import React from "react";
import { FileText, Image as ImageIcon, FileCode, Sparkles, Trash2, CheckCircle, Loader2, AlertCircle } from "lucide-react";

export const SourceItem = ({ source, onToggle, onDelete }) => {
  if (!source) return null;

  const isPdf = source.type === "pdf";
  const isImage = source.type === "image";
  const isLearned = source.type === "ai_answer";

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
        source.enabled
          ? "bg-[var(--bg-panel)] border-[var(--border)] shadow-xs"
          : "bg-[var(--bg-input)]/60 border-[var(--border)] opacity-60"
      }`}
    >
      {/* Icon + Title */}
      <div className="flex items-center gap-2.5 overflow-hidden flex-1">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
            isPdf
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-200/60 dark:border-rose-800/60"
              : isImage
              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-500 border-purple-200/60 dark:border-purple-800/60"
              : isLearned
              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-500 border-amber-200/60 dark:border-amber-800/60"
              : "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30"
          }`}
        >
          {isPdf ? (
            <FileText size={18} />
          ) : isImage ? (
            <ImageIcon size={18} />
          ) : isLearned ? (
            <Sparkles size={18} />
          ) : (
            <FileCode size={18} />
          )}
        </div>

        <div className="flex flex-col overflow-hidden min-w-0">
          <p className="text-xs font-semibold text-[var(--text)] truncate leading-tight" title={source.title}>
            {source.title}
          </p>

          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)]">
            {source.status === "ready" && (
              <span className="text-[var(--accent)] font-medium">
                {source.chunkCount} {source.chunkCount === 1 ? "chunk" : "chunks"}
                {source.pageCount > 0 ? ` · ${source.pageCount} ${source.pageCount === 1 ? "page" : "pages"}` : ""}
              </span>
            )}
            {source.status === "processing" && (
              <span className="text-[var(--accent)] flex items-center gap-1 font-medium animate-pulse">
                <Loader2 size={10} className="animate-spin" /> Ingesting...
              </span>
            )}
            {source.status === "pending" && (
              <span>Queued</span>
            )}
            {source.status === "failed" && (
              <span className="text-[var(--danger)] flex items-center gap-1 font-medium" title={source.error || "Failed"}>
                <AlertCircle size={10} /> Ingestion failed
              </span>
            )}

            {source.sizeBytes > 0 && <span>· {formatSize(source.sizeBytes)}</span>}
          </div>
        </div>
      </div>

      {/* Controls: Enable toggle + Delete */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <label className="relative inline-flex items-center cursor-pointer" title={source.enabled ? "Disable source" : "Enable source"}>
          <input
            type="checkbox"
            checked={source.enabled}
            onChange={(e) => onToggle(source._id, e.target.checked)}
            disabled={source.status !== "ready"}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-[var(--border)] peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--accent)] disabled:opacity-40"></div>
        </label>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete "${source.title}" from this chat's knowledge base?`)) {
              onDelete(source._id);
            }
          }}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors cursor-pointer"
          title="Delete source"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default SourceItem;

