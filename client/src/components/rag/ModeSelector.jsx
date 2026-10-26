import React from "react";
import { Book, Sparkles, PowerOff } from "lucide-react";

export const ModeSelector = ({ mode = "strict", onSelectMode }) => {
  const modes = [
    {
      id: "strict",
      label: "Docs only",
      icon: Book,
      desc: "Answers exclusively from your uploaded documents with citations.",
    },
    {
      id: "hybrid",
      label: "Docs + General",
      icon: Sparkles,
      desc: "Uses docs first, falls back to general knowledge if not in documents.",
    },
    {
      id: "off",
      label: "Off",
      icon: PowerOff,
      desc: "Standard AI chatbot without grounding in uploaded files.",
    },
  ];

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)] px-0.5">
        <span>Answering Mode</span>
        <span className="text-[11px] font-normal text-[var(--text-muted)]">
          {mode === "strict" ? "Strict grounding" : mode === "hybrid" ? "Hybrid fallback" : "RAG disabled"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-input)] rounded-xl border border-[var(--border)]">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMode(m.id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-[var(--bg-panel)] text-[var(--accent)] shadow-xs font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-panel)]/50"
              }`}
              title={m.desc}
            >
              <Icon size={13} className="flex-shrink-0" />
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;

