import React, { useState } from "react";
import { Check, X, RotateCcw, ChevronRight } from "lucide-react";

export const QuizCard = ({ quiz, messageId }) => {
  const questions = quiz?.questions || [];
  const total = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!questions || total === 0) {
    return null;
  }

  const currentQ = questions[currentIndex];
  const hasAnsweredCurrent = selectedAnswers[currentIndex] !== undefined;
  const currentSelected = selectedAnswers[currentIndex];
  const isCurrentCorrect = hasAnsweredCurrent && currentSelected === currentQ.correctAnswerIndex;

  const handleSelectOption = (optionIdx) => {
    if (hasAnsweredCurrent) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
  };

  const correctCount = Object.entries(selectedAnswers).filter(
    ([idx, selected]) => questions[parseInt(idx, 10)]?.correctAnswerIndex === selected
  ).length;

  const percentage = Math.round((correctCount / total) * 100);

  // Results screen
  if (showResults) {
    return (
      <div className="w-full max-w-[420px] bg-[var(--bubble-in)] border border-[var(--border)] rounded-[12px] p-5 shadow-[var(--shadow-sm)] flex flex-col items-center text-center">
        <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">
          Quiz Completed
        </h3>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          {quiz.title || "Document Knowledge Quiz"}
        </p>

        <div className="my-5 flex flex-col items-center">
          <div className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight">
            {correctCount} / {total}
          </div>
          <span className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            {percentage}% Score
          </span>
        </div>

        <p className="text-[13px] text-[var(--text-secondary)] max-w-xs mb-5 leading-relaxed">
          {percentage >= 80
            ? "Excellent understanding of the source material."
            : percentage >= 50
            ? "Good effort. Review the cited sources to improve your mastery."
            : "Review the source documents and try the quiz again."}
        </p>

        <button
          type="button"
          onClick={handleRetake}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[var(--border-strong)] text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        >
          <RotateCcw size={15} />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] bg-[var(--bubble-in)] border border-[var(--border)] rounded-[12px] p-4 flex flex-col gap-3 shadow-[var(--shadow-sm)]">
      {/* Quiz Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[15px] font-semibold text-[var(--text-primary)] line-clamp-1">
            {quiz.title || "Document Quiz"}
          </h4>
          <span className="text-[12px] text-[var(--text-secondary)]">
            Question {currentIndex + 1} of {total}
          </span>
        </div>

        <div className="text-[12px] font-medium text-[var(--text-secondary)]">
          {Object.keys(selectedAnswers).length}/{total}
        </div>
      </div>

      {/* Progress Bar (4px tall, radius 9999px, track --border, fill --accent) */}
      <div className="w-full bg-[var(--border)] h-1 rounded-full overflow-hidden">
        <div
          className="bg-[var(--accent)] h-full transition-all duration-200"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question Text */}
      <div className="pt-1">
        <h3 className="text-[15px] font-medium text-[var(--text-primary)] leading-snug">
          {currentQ.question}
        </h3>
      </div>

      {/* Options List */}
      <div className="flex flex-col gap-2">
        {currentQ.options.map((option, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx);
          const isSelected = currentSelected === optIdx;
          const isCorrectAnswer = optIdx === currentQ.correctAnswerIndex;

          let btnClass = "border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]";
          let badgeClass = "border-[var(--border-strong)] text-[var(--text-secondary)]";

          if (hasAnsweredCurrent) {
            if (isCorrectAnswer) {
              btnClass = "border-[var(--success)] bg-[rgba(31,168,85,0.10)] text-[var(--text-primary)]";
              badgeClass = "bg-[var(--success)] text-white border-[var(--success)]";
            } else if (isSelected && !isCorrectAnswer) {
              btnClass = "border-[var(--danger)] bg-[rgba(217,45,32,0.08)] text-[var(--text-primary)]";
              badgeClass = "bg-[var(--danger)] text-white border-[var(--danger)]";
            } else {
              btnClass = "opacity-60 border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-primary)]";
            }
          } else if (isSelected) {
            btnClass = "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]";
            badgeClass = "bg-[var(--accent)] text-white border-[var(--accent)]";
          }

          return (
            <button
              key={optIdx}
              type="button"
              disabled={hasAnsweredCurrent}
              onClick={() => handleSelectOption(optIdx)}
              className={`w-full min-h-[44px] text-left p-2.5 px-3 rounded-[10px] border flex items-center justify-between text-[13px] transition-colors cursor-pointer ${btnClass}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[12px] font-semibold flex-shrink-0 ${badgeClass}`}>
                  {letter}
                </span>
                <span>{option}</span>
              </div>

              {hasAnsweredCurrent && isCorrectAnswer && (
                <Check size={16} className="text-[var(--success)] flex-shrink-0" />
              )}
              {hasAnsweredCurrent && isSelected && !isCorrectAnswer && (
                <X size={16} className="text-[var(--danger)] flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {hasAnsweredCurrent && (
        <div className="p-3 rounded-[8px] text-[12px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)] block mb-0.5">
            {isCurrentCorrect ? "Correct" : "Explanation"}
          </span>
          <p className="leading-relaxed">{currentQ.explanation}</p>
        </div>
      )}

      {/* Next Question / Finish Button */}
      {hasAnsweredCurrent && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[13px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors cursor-pointer"
          >
            <span>{currentIndex < total - 1 ? "Next question" : "Finish quiz"}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizCard;
