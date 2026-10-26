import React, { useState } from "react";
import { FileText, X } from "lucide-react";

export const CitationChips = ({ sources = [] }) => {
  const [activeChip, setActiveChip] = useState(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-[var(--border)] flex flex-col gap-1.5">
      <div className="text-[12px] font-[500] text-[var(--text-secondary)]">
        Sources ({sources.length}):
      </div>

      <div className="flex flex-wrap gap-1.5 relative">
        {sources.map((s, idx) => {
          const num = idx + 1;
          const isSelected = activeChip === idx;
          const title = s.title || "Document";
          const pageStr = s.page ? ` · p.${s.page}` : "";

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveChip(isSelected ? null : idx)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[12px] font-normal border transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
              }`}
              title={`View citation [${num}]`}
            >
              <span>{num} · {title}{pageStr}</span>
            </button>
          );
        })}

        {/* Popover snippet preview */}
        {activeChip !== null && sources[activeChip] && (
          <div className="w-full mt-2 p-3 rounded-[8px] bg-[var(--bg-input)] border border-[var(--border)] shadow-[var(--shadow-sm)] text-left text-[12px] text-[var(--text-primary)] animate-[fadeIn_0.15s_ease] z-20">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[var(--border)]">
              <div className="flex items-center gap-1.5 font-medium text-[var(--accent)] truncate">
                <FileText size={14} className="flex-shrink-0" />
                <span className="truncate">
                  [{activeChip + 1}] {sources[activeChip].title || "Document"}
                  {sources[activeChip].page ? ` (Page ${sources[activeChip].page})` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveChip(null)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-[12px] leading-relaxed text-[var(--text-secondary)] italic">
              "{sources[activeChip].snippet || sources[activeChip].text || "No snippet available"}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitationChips;
