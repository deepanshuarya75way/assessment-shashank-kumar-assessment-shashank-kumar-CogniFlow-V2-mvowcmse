import React, { useState, useRef } from "react";
import { X, UploadCloud, Plus, FileText, BookOpen, Layers, Sparkles } from "lucide-react";
import ModeSelector from "./ModeSelector";
import SourceItem from "./SourceItem";

export const KnowledgePanel = ({
  isOpen,
  onClose,
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
  const [activeTab, setActiveTab] = useState("file"); // "file" | "text"
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textContent.trim()) return;
    await onUploadText(textTitle.trim(), textContent.trim());
    setTextTitle("");
    setTextContent("");
    setActiveTab("file");
  };

  const readyCount = sources.filter((s) => s.status === "ready" && s.enabled).length;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[var(--bg-panel)] shadow-2xl border-l border-[var(--border)] z-50 flex flex-col animate-[slideInRight_0.25s_cubic-bezier(0.16,1,0.3,1)]">
      
      {/* Header */}
      <div className="h-[60px] px-5 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5 text-[var(--accent)]">
          <BookOpen size={20} />
          <div>
            <h3 className="font-semibold text-base text-[var(--text)] leading-tight">Chat Knowledge</h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              {readyCount} ready {readyCount === 1 ? "source" : "sources"} in this room
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--icon-default)] hover:text-[var(--text)] hover:bg-[var(--bg-input)] transition-all cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        
        {/* Mode Selector */}
        <ModeSelector mode={ragMode} onSelectMode={onUpdateMode} />

        {/* Quick Quiz on Documents Action */}
        {readyCount > 0 && onGenerateQuiz && (
          <div className="p-3.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[var(--accent)]" />
                Test Your Knowledge
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Generate an interactive quiz from your docs
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onGenerateQuiz();
                onClose();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-xs transition-colors cursor-pointer flex-shrink-0"
            >
              <span>Take Quiz</span>
            </button>
          </div>
        )}

        {/* Upload Tabs */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Add Knowledge</span>
            <div className="flex gap-1 bg-[var(--bg-input)] p-0.5 rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab("file")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                  activeTab === "file"
                    ? "bg-[var(--bg-panel)] text-[var(--accent)] shadow-xs font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                  activeTab === "text"
                    ? "bg-[var(--bg-panel)] text-[var(--accent)] shadow-xs font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {activeTab === "file" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] scale-[0.99]"
                  : "border-[var(--border)] bg-[var(--bg-input)]/50 hover:bg-[var(--bg-input)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-11 h-11 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-2">
                <UploadCloud size={22} />
              </div>
              <p className="text-xs font-semibold text-[var(--text)]">
                Click to upload or drag & drop
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                PDF, PNG, JPG, WEBP (Max 10 MB, up to 200 pages)
              </p>

              {isUploading && (
                <div className="w-full mt-3 flex flex-col gap-1">
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-200"
                      style={{ width: `${uploadProgress || 30}%` }}
                    ></div>
                  </div>
                  <span className="text-[11px] text-[var(--accent)] font-medium">Uploading & vectorizing...</span>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-input)]/40">
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Note Title (e.g. Project Specifications)"
                className="w-full py-2 px-3 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
              <textarea
                rows={4}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste key notes, FAQs, or raw facts here..."
                required
                className="w-full py-2 px-3 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none"
              />
              <button
                type="submit"
                disabled={isUploading || !textContent.trim()}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-xs transition-colors self-end disabled:opacity-50 cursor-pointer"
              >
                Add Note
              </button>
            </form>
          )}
        </div>

        {/* Sources List */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
            <span>Knowledge Sources ({sources.length})</span>
          </div>

          {sources.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-[var(--border)] text-center flex flex-col items-center justify-center text-[var(--text-muted)]">
              <Layers size={26} className="mb-2 opacity-40 text-[var(--accent)]" />
              <p className="text-xs font-medium">No documents uploaded yet</p>
              <p className="text-[11px] mt-1 max-w-[220px]">
                Upload a PDF or image above to ground CogniBot's answers in your data.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sources.map((s) => (
                <SourceItem
                  key={s._id}
                  source={s}
                  onToggle={onToggleSource}
                  onDelete={onDeleteSource}
                />
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default KnowledgePanel;

