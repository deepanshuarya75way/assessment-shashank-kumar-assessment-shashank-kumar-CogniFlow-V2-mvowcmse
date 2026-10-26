import React from "react";
import { BookOpen, AlertCircle, FileSearch } from "lucide-react";

export const AnswerBadge = ({ answerMode }) => {
  if (!answerMode || answerMode === "plain") return null;

  if (answerMode === "grounded") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs mb-1.5 self-start">
        <BookOpen size={12} className="flex-shrink-0" />
        <span>From your documents</span>
      </div>
    );
  }

  if (answerMode === "general") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs mb-1.5 self-start">
        <AlertCircle size={12} className="flex-shrink-0" />
        <span>Not from your documents</span>
      </div>
    );
  }

  if (answerMode === "no_context") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 shadow-xs mb-1.5 self-start">
        <FileSearch size={12} className="flex-shrink-0" />
        <span>No document match</span>
      </div>
    );
  }

  return null;
};

export default AnswerBadge;
