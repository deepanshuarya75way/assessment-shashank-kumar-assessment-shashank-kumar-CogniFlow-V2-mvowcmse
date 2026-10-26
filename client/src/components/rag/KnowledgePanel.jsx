
import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  BookOpen,
  Sparkles,
} from "lucide-react";

import ModeSelector from "./ModeSelector";
import KnowledgeExplorer from "./KnowledgeExplorer";

export const KnowledgePanel = ({
  isOpen,
  onClose,
  roomId,
  sources = [],
  ragMode = "strict",
  isUploading = false,
  uploadProgress = 0,
  onUploadFile,
  onUploadText,
  onToggleSource,
  onDeleteSource,
  onUpdateMode,
  onGenerateQuiz,
}) => {
  const [activeTab, setActiveTab] = useState("file");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Count enabled sources that are ready to use.
  const readyCount = sources.filter(
    (source) => source.status === "ready" && source.enabled
  ).length;

  // Handle a dropped file.
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    const files = e.dataTransfer?.files;

    if (files && files.length > 0 && onUploadFile) {
      onUploadFile(files[0]);
    }
  };

  // Handle file selection from the file picker.
  const handleFileInputChange = (e) => {
    const files = e.target.files;

    if (files && files.length > 0 && onUploadFile) {
      onUploadFile(files[0]);
    }

    // Allow selecting the same file again.
    e.target.value = "";
  };

  // Handle text submission.
  const handleTextSubmit = async (e) => {
    e.preventDefault();

    const title = textTitle.trim();
    const content = textContent.trim();

    if (!content || isUploading || !onUploadText) return;

    try {
      await onUploadText(title, content);

      setTextTitle("");
      setTextContent("");
      setActiveTab("file");
    } catch (error) {
      console.error("Failed to upload text:", error);
    }
  };

  const handleGenerateQuiz = () => {
    if (!onGenerateQuiz) return;

    onGenerateQuiz();
    onClose?.();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--border)] bg-[var(--bg-panel)] shadow-2xl animate-[slideInRight_0.25s_cubic-bezier(0.16,1,0.3,1)] sm:w-[420px]">

      {/* Header */}
      <div className="flex h-[60px] flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-5">
        <div className="flex items-center gap-2.5 text-[var(--accent)]">
          <BookOpen size={20} />

          <div>
            <h3 className="text-base font-semibold leading-tight text-[var(--text)]">
              Chat Knowledge
            </h3>

            <p className="text-[11px] text-[var(--text-muted)]">
              {readyCount} ready{" "}
              {readyCount === 1 ? "source" : "sources"} in this room
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close knowledge panel"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--icon-default)] transition-all hover:bg-[var(--bg-input)] hover:text-[var(--text)]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">

        {/* Mode Selector */}
        <ModeSelector
          mode={ragMode}
          onSelectMode={onUpdateMode}
        />

        {/* Quick Quiz */}
        {readyCount > 0 && onGenerateQuiz && (
          <div className="flex items-center justify-between rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-3.5 shadow-xs">
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)]">
                <Sparkles
                  size={14}
                  className="text-[var(--accent)]"
                />
                Test Your Knowledge
              </span>

              <span className="text-[11px] text-[var(--text-muted)]">
                Generate an interactive quiz from your docs
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerateQuiz}
              className="flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[var(--accent-hover)]"
            >
              Take Quiz
            </button>
          </div>
        )}

        {/* Add Knowledge */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Add Knowledge</span>

            <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("file")}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                  activeTab === "file"
                    ? "bg-[var(--bg-panel)] font-semibold text-[var(--accent)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                Upload File
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                  activeTab === "text"
                    ? "bg-[var(--bg-panel)] font-semibold text-[var(--accent)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {/* File Upload */}
          {activeTab === "file" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();

                if (!isUploading) {
                  setIsDragging(true);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleFileDrop}
              onClick={() => {
                if (!isUploading) {
                  fileInputRef.current?.click();
                }
              }}
              onKeyDown={(e) => {
                if (
                  !isUploading &&
                  (e.key === "Enter" || e.key === " ")
                ) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={isUploading ? -1 : 0}
              aria-label="Upload a PDF or image"
              aria-disabled={isUploading}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                isUploading
                  ? "cursor-not-allowed opacity-70"
                  : "cursor-pointer"
              } ${
                isDragging
                  ? "scale-[0.99] border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--bg-input)]/50 hover:bg-[var(--bg-input)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileInputChange}
                disabled={isUploading}
                className="hidden"
              />

              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <UploadCloud size={22} />
              </div>

              <p className="text-xs font-semibold text-[var(--text)]">
                {isUploading
                  ? "Uploading file..."
                  : "Click to upload or drag & drop"}
              </p>

              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                PDF, PNG, JPG, WEBP (Max 10 MB, up to 200 pages)
              </p>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-3 flex w-full flex-col gap-1">
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(
                      100,
                      Math.max(0, uploadProgress || 30)
                    )}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, uploadProgress || 30)
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="text-[11px] font-medium text-[var(--accent)]">
                    Uploading &amp; vectorizing...
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Text Upload */
            <form
              onSubmit={handleTextSubmit}
              className="flex flex-col gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-input)]/40 p-3.5"
            >
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Note Title (e.g. Project Specifications)"
                aria-label="Note title"
                disabled={isUploading}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />

              <textarea
                rows={4}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste key notes, FAQs, or raw facts here..."
                aria-label="Note content"
                required
                disabled={isUploading}
                className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />

              <button
                type="submit"
                disabled={
                  isUploading ||
                  !textContent.trim() ||
                  !onUploadText
                }
                className="self-end rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? "Adding..." : "Add Note"}
              </button>
            </form>
          )}
        </div>

        {/* Knowledge Explorer */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[var(--text)]">
              Knowledge Explorer
            </h4>

            <span className="text-xs text-[var(--text-muted)]">
              {sources.length}{" "}
              {sources.length === 1 ? "source" : "sources"}
            </span>
          </div>

          <KnowledgeExplorer
            roomId={roomId}
            onToggle={onToggleSource}
            onDelete={onDeleteSource}
          />
        </div>

      </div>
      {/* End Scrollable Content */}

    </div>
    // End Panel
  );
};

export default KnowledgePanel;
