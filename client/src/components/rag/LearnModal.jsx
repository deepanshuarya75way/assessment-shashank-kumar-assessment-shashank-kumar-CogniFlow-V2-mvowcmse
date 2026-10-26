import React, { useState, useEffect } from "react";
import { X, BookPlus, AlertTriangle } from "lucide-react";

export const LearnModal = ({ isOpen, onClose, message, onSave }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (message) {
      setQuestion(message.replyToQuestion || "");
      setAnswer(message.content || "");
    }
  }, [message]);

  if (!isOpen || !message) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave(message._id, {
        question: question.trim(),
        answer: answer.trim(),
      });
      onClose();
    } catch {
      // toast handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(11,20,26,0.5)] animate-[modalBackdrop_0.15s_ease-out]">
      <div className="w-full max-w-lg bg-[var(--bg-panel)] rounded-[14px] shadow-[var(--shadow-md)] border border-[var(--border)] p-6 flex flex-col gap-4 animate-[modalContent_0.15s_cubic-bezier(0.2,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <BookPlus size={20} strokeWidth={1.75} />
            <h3 className="font-semibold text-[17px] text-[var(--text-primary)]">Add to Chat Knowledge</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-hover)] cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Note */}
        <div className="p-3 rounded-[8px] bg-[var(--bg-input)] border border-[var(--border)] flex items-start gap-2.5 text-[12px] text-[var(--text-secondary)]">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <p>
            Only add answers you trust. CogniBot will index this exact Q&A and use it to answer future questions in this chat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              className="w-full h-10 px-3.5 rounded-[10px] bg-[var(--bg-input)] border border-[var(--border)] text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">Verified Answer</label>
            <textarea
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              className="w-full p-3 rounded-[10px] bg-[var(--bg-input)] border border-[var(--border)] text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-[10px] text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-4 rounded-[10px] text-[14px] font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save to Knowledge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LearnModal;
