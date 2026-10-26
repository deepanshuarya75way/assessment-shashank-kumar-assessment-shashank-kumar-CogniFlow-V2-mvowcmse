import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  X,
  BookOpen,
  Sparkles,
  MessageSquare,
  UploadCloud,
  FileText,
  Plus,
  ExternalLink,
  Send,
  HelpCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useKnowledge } from "../../hooks/useKnowledge";
import ModeSelector from "./ModeSelector";
import SourceItem from "./SourceItem";
import QuizCard from "./QuizCard";
import AnswerBadge from "./AnswerBadge";
import CitationChips from "./CitationChips";
import FallbackActions from "./FallbackActions";
import LearnModal from "./LearnModal";
import { getBackendUrl } from "../../utils/apiConfig";

const BackendUrl = getBackendUrl();

export const CogniAiModal = ({
  isOpen,
  onClose,
  cogniRoom,
  socket,
  onOpenFullChat,
  initialTab = "quiz",
}) => {
  const [activeTab, setActiveTab] = useState(initialTab); // "quiz" | "docs" | "chat"
  const [quizTopic, setQuizTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Docs Tab State
  const [uploadTab, setUploadTab] = useState("file"); // "file" | "text"
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Chat Tab State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [learnModalMessage, setLearnModalMessage] = useState(null);
  const chatBottomRef = useRef(null);

  const currentUserId = localStorage.getItem("userid");
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const roomId = cogniRoom?._id;

  const {
    sources,
    loading: loadingSources,
    ragMode,
    isUploading,
    readySourcesCount,
    uploadSource,
    uploadText,
    toggleSource,
    deleteSource,
    updateMode,
    answerGeneral,
    learnFromAnswer,
    generateQuiz,
  } = useKnowledge(roomId, socket);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Load chat messages when modal opens on chat tab
  useEffect(() => {
    if (!isOpen || !roomId) return;

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(
          `${BackendUrl}/api/messages/${roomId}`,
          authHeaders
        );
        setChatMessages(data);

        // If there's an existing quiz in chat history, load the latest one
        const latestQuiz = data
          .slice()
          .reverse()
          .find((m) => m.messageType === "quiz" && m.quizData);
        if (latestQuiz && !activeQuiz) {
          setActiveQuiz(latestQuiz.quizData);
        }
      } catch (err) {
        console.error("Error fetching messages for CogniAi modal:", err);
      }
    };

    fetchMessages();
  }, [isOpen, roomId]);

  // Listen to incoming messages via socket
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleMessage = (msg) => {
      const msgRoomId = msg.room?._id || msg.room;
      if (String(msgRoomId) === String(roomId)) {
        setChatMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        if (msg.messageType === "quiz" && msg.quizData) {
          setActiveQuiz(msg.quizData);
          setActiveTab("quiz");
        }
      }
    };

    const handleEdited = (msg) => {
      setChatMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };

    socket.on("message received", handleMessage);
    socket.on("message edited", handleEdited);

    return () => {
      socket.off("message received", handleMessage);
      socket.off("message edited", handleEdited);
    };
  }, [socket, roomId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

  // Handle Quiz Generation
  const handleGenerateQuiz = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsGeneratingQuiz(true);
      const data = await generateQuiz(quizTopic.trim(), numQuestions);
      if (data?.message?.quizData) {
        setActiveQuiz(data.message.quizData);
        setActiveTab("quiz");
      }
    } catch {
      // Toast handled by hook
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Handle File Drop
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadSource(e.dataTransfer.files[0]);
    }
  };

  // Handle File Select
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadSource(e.target.files[0]);
      e.target.value = "";
    }
  };

  // Handle Text Note Submit
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textContent.trim()) return;
    await uploadText(textTitle.trim(), textContent.trim());
    setTextTitle("");
    setTextContent("");
    setUploadTab("file");
  };

  // Handle Sending Chat Question
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userPrompt = chatInput.trim();
    setChatInput("");
    setIsSending(true);

    try {
      const { data } = await axios.post(
        `${BackendUrl}/api/messages`,
        { content: userPrompt, roomId },
        authHeaders
      );
      setChatMessages((prev) => [...prev, data]);
      socket?.emit("new message", data);
    } catch (err) {
      console.error("Error sending message to CogniBot:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease]">
      <div className="w-full max-w-4xl h-[90vh] max-h-[720px] bg-[var(--card)]/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden animate-[scaleUp_0.2s_ease]">
        
        {/* MODAL HEADER */}
        <div className="p-4 px-6 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 flex-shrink-0">
              <div className="w-full h-full bg-[var(--card)] rounded-[14px] flex items-center justify-center p-1.5">
                <img src="/images/ai-button-logo.png" alt="CogniAi" className="w-full h-full object-contain" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-[var(--text)] leading-tight">
                  CogniAi Study & Knowledge Hub
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {readySourcesCount} {readySourcesCount === 1 ? "doc" : "docs"} ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload documents, ask questions with citations, or test your comprehension with quizzes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFullChat && (
              <button
                type="button"
                onClick={() => {
                  onOpenFullChat();
                  onClose();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100/70 dark:bg-slate-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer"
                title="Open full chat in main window"
              >
                <ExternalLink size={13} />
                <span>Open in Chat</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/20">
          <div className="flex gap-2 py-2.5">
            <button
              type="button"
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "quiz"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
              }`}
            >
              <Sparkles size={14} className={activeTab === "quiz" ? "animate-pulse" : ""} />
              <span>Interactive Quiz</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("docs")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "docs"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
              }`}
            >
              <BookOpen size={14} />
              <span>Knowledge & Docs ({sources.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
              }`}
            >
              <MessageSquare size={14} />
              <span>Ask & Chat</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-hide bg-[var(--bg)]/40">
          
          {/* TAB 1: INTERACTIVE QUIZ */}
          {activeTab === "quiz" && (
            <div className="flex flex-col items-center gap-5 max-w-2xl mx-auto animate-[fadeIn_0.2s_ease]">
              {/* Quiz Generator Control Bar */}
              <div className="w-full bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Generate Practice Quiz
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Creates interactive MCQs strictly based on your uploaded documents
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-2 py-0.5 rounded-full border border-violet-200/60 dark:border-violet-800/60">
                    AI Examiner
                  </span>
                </div>

                <form onSubmit={handleGenerateQuiz} className="flex flex-col sm:flex-row gap-2 mt-1">
                  <input
                    type="text"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    placeholder="Specific topic or chapter (optional)..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[var(--text)] outline-none focus:border-violet-500 transition-colors"
                  />

                  <div className="flex gap-2">
                    <select
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="px-2.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[var(--text)] outline-none cursor-pointer"
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={8}>8 Questions</option>
                    </select>

                    <button
                      type="submit"
                      disabled={isGeneratingQuiz || readySourcesCount === 0}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Sparkles size={13} className={isGeneratingQuiz ? "animate-spin" : ""} />
                      <span>{isGeneratingQuiz ? "Generating..." : "Generate Quiz"}</span>
                    </button>
                  </div>
                </form>

                {readySourcesCount === 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <span>⚠️ No documents uploaded yet. Upload a PDF first to take quizzes!</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("docs")}
                      className="font-bold underline cursor-pointer ml-2"
                    >
                      Upload Now →
                    </button>
                  </div>
                )}
              </div>

              {/* Render Active Quiz */}
              {activeQuiz ? (
                <div className="w-full flex justify-center">
                  <QuizCard quiz={activeQuiz} />
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center opacity-70">
                  <div className="w-14 h-14 rounded-2xl bg-violet-100/60 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text)]">Ready to test your knowledge?</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                    Click "Generate Quiz" above to create an interactive comprehension test from your documents.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KNOWLEDGE & DOCUMENTS */}
          {activeTab === "docs" && (
            <div className="flex flex-col gap-5 max-w-3xl mx-auto animate-[fadeIn_0.2s_ease]">
              {/* Mode Selector */}
              <ModeSelector mode={ragMode} onSelectMode={updateMode} />

              {/* Upload Dropzone & Form */}
              <div className="bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Add Documents to CogniAi Knowledge</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setUploadTab("file")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        uploadTab === "file"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      PDF / Document
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadTab("text")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        uploadTab === "text"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Paste Text Note
                    </button>
                  </div>
                </div>

                {uploadTab === "file" ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                        : "border-slate-200 dark:border-slate-700/80 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileInputChange}
                      accept=".pdf,image/*,.txt"
                    />

                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                      <UploadCloud size={20} />
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Click to upload or drag & drop documents
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PDFs, Images, or Text (up to 10MB) • Automatic OCR & Chunking
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleTextSubmit} className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Title of this knowledge note..."
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      className="w-full p-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[var(--text)] outline-none focus:border-blue-500 transition-colors"
                    />
                    <textarea
                      placeholder="Paste textbook notes, syllabus, key formulas, or reference content here..."
                      rows={4}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="w-full p-2.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[var(--text)] outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!textContent.trim() || isUploading}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        Add to Knowledge Base
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Uploaded Documents List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 px-1">
                  <span>Uploaded Documents ({sources.length})</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {readySourcesCount} active for retrieval
                  </span>
                </div>

                {loadingSources ? (
                  <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
                    Loading knowledge sources...
                  </div>
                ) : sources.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
                    No documents uploaded yet. Add a PDF above to enable grounded AI answers and quizzes.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {sources.map((s) => (
                      <SourceItem
                        key={s._id}
                        source={s}
                        onToggle={toggleSource}
                        onDelete={deleteSource}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ASK & CHAT */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full gap-3 max-w-2xl mx-auto animate-[fadeIn_0.2s_ease]">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-[300px] p-2">
                {chatMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-75">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                      <HelpCircle size={22} />
                    </div>
                    <h4 className="font-bold text-sm text-[var(--text)]">Ask CogniAi Anything</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-0.5">
                      CogniAi answers strictly using verified facts from your uploaded documents with source citations.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((m) => {
                    const isUser = String(m.sender?._id || m.sender) === String(currentUserId);
                    return (
                      <div
                        key={m._id}
                        className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 text-xs rounded-2xl ${
                            isUser
                              ? "bg-blue-600 text-white rounded-tr-xs"
                              : "bg-[var(--card)] text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-800 shadow-xs"
                          }`}
                        >
                          {m.isAiResponse && <AnswerBadge answerMode={m.answerMode} />}

                          {m.messageType === "quiz" && m.quizData ? (
                            <QuizCard quiz={m.quizData} messageId={m._id} />
                          ) : (
                            <div className="markdown-body leading-relaxed break-words">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          )}

                          {m.isAiResponse && m.ragSources && m.ragSources.length > 0 && (
                            <CitationChips sources={m.ragSources} />
                          )}

                          {m.isAiResponse && (
                            <FallbackActions
                              message={m}
                              onAnswerGeneral={answerGeneral}
                              onOpenLearnModal={(targetMsg) => setLearnModalMessage(targetMsg)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="flex-1 p-2.5 px-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--card)] text-[var(--text)] outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSending}
                  className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Learn Modal */}
      {learnModalMessage && (
        <LearnModal
          isOpen={Boolean(learnModalMessage)}
          onClose={() => setLearnModalMessage(null)}
          message={learnModalMessage}
          onSave={learnFromAnswer}
        />
      )}
    </div>
  );
};

export default CogniAiModal;
