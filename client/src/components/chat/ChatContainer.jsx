import React, { useState, useEffect, useRef } from "react";
import Avatar from "../ui/Avatar";
import toast from "react-hot-toast";
import axios from "axios";
import io from "socket.io-client";
import {
  Pencil,
  Trash2,
  X,
  Paperclip,
  FileText,
  Download,
  MoreVertical,
  Check,
  CheckCheck,
  Sparkles,
  Bot,
  Send,
  ChevronDown
} from "lucide-react";
import DeleteMessageModal from "./DeleteMessageModal";
import GroupSettingsModal from "./GroupSettingsModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useKnowledge } from "../../hooks/useKnowledge";
import KnowledgePanel from "../rag/KnowledgePanel";
import CitationChips from "../rag/CitationChips";
import AnswerBadge from "../rag/AnswerBadge";
import FallbackActions from "../rag/FallbackActions";
import LearnModal from "../rag/LearnModal";
import QuizCard from "../rag/QuizCard";
import { getBackendUrl, createResilientSocket } from "../../utils/apiConfig";
import { getAuthToken, getAuthUserId, clearAuthSession } from "../../utils/authStorage";

const SENDER_COLORS = [
  "#5B7083",
  "#E06928",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#D97706",
  "#4F46E5",
];

const getSenderColor = (id = "") => {
  if (!id) return SENDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
};

const ChatContainer = ({ selectedChat, setSelectedChat, onlineUsers = [] }) => {
  const BackendUrl = getBackendUrl();
  const [currentUserId] = useState(() => getAuthUserId());
  const [token] = useState(() => getAuthToken());
  const selectedChatRef = useRef(selectedChat);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isTypingIndicatorVisible, setIsTypingIndicatorVisible] = useState(false);
  const typingTimeoutRef = useRef(null);

  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadWhileScrolled, setUnreadWhileScrolled] = useState(0);

  // RAG Knowledge Integration
  const [isKnowledgePanelOpen, setIsKnowledgePanelOpen] = useState(false);
  const [learnModalMessage, setLearnModalMessage] = useState(null);

  const {
    sources,
    ragMode,
    isUploading: isKnowledgeUploading,
    uploadProgress,
    uploadSource,
    uploadText,
    toggleSource,
    deleteSource,
    updateMode,
    generateQuiz,
    answerGeneral,
    learnFromAnswer,
  } = useKnowledge({
    roomId: selectedChat?._id,
    token,
    backendUrl: BackendUrl,
    onQuizGenerated: (quiz) => {
      // Quiz generated callback
    },
  });

  const readySourcesCount = sources.filter((s) => s.status === "ready" && s.enabled).length;

  useEffect(() => {
    selectedChatRef.current = selectedChat;
    setIsKnowledgePanelOpen(false);
    setUnreadWhileScrolled(0);
    setShowScrollBottom(false);
    isAtBottomRef.current = true;
  }, [selectedChat]);

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      isAtBottomRef.current = true;
      setShowScrollBottom(false);
      setUnreadWhileScrolled(0);
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 120;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom <= threshold;

    isAtBottomRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);

    if (isNearBottom) {
      setUnreadWhileScrolled(0);
    }
  };

  useEffect(() => {
    socketRef.current = createResilientSocket();

    socketRef.current.on("connect", () => {
      socketRef.current.emit("setup", currentUserId);
    });

    socketRef.current.on("typing", (room) => {
      if (selectedChatRef.current && String(selectedChatRef.current._id) === String(room)) {
        setIsTypingIndicatorVisible(true);
      }
    });

    socketRef.current.on("stop typing", (room) => {
      if (selectedChatRef.current && String(selectedChatRef.current._id) === String(room)) {
        setIsTypingIndicatorVisible(false);
      }
    });

    socketRef.current.on("message received", (newMessage) => {
      const activeId = selectedChatRef.current?._id;
      const targetRoomId = newMessage.room?._id || newMessage.room;

      if (activeId && String(activeId) === String(targetRoomId)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          const filtered = prev.filter(
            (m) => !(m.isOptimistic && m.senderId === newMessage.sender?._id && m.content === newMessage.content)
          );
          return [...filtered, newMessage];
        });

        if (isAtBottomRef.current) {
          setTimeout(() => scrollToBottom("smooth"), 50);
        } else {
          setUnreadWhileScrolled((prev) => prev + 1);
        }
      }
    });

    socketRef.current.on("message deleted", (deletedMessage) => {
      const activeId = selectedChatRef.current?._id;
      const targetRoomId = deletedMessage.room?._id || deletedMessage.room;
      if (activeId && String(activeId) === String(targetRoomId)) {
        setMessages((prev) =>
          prev.map((m) => (m._id === deletedMessage._id ? deletedMessage : m))
        );
      }
    });

    socketRef.current.on("message edited", (editedMessage) => {
      const activeId = selectedChatRef.current?._id;
      const targetRoomId = editedMessage.room?._id || editedMessage.room;
      if (activeId && String(activeId) === String(targetRoomId)) {
        setMessages((prev) =>
          prev.map((m) => (m._id === editedMessage._id ? editedMessage : m))
        );
      }
    });

    socketRef.current.on("chat cleared", ({ roomId }) => {
      const activeId = selectedChatRef.current?._id;
      if (activeId && String(activeId) === String(roomId)) {
        setMessages([]);
      }
    });

    return () => socketRef.current?.disconnect();
  }, [BackendUrl, currentUserId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      try {
        setLoadingMessages(true);
        const { data } = await axios.get(
          `${BackendUrl}/api/messages/${selectedChat._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(data);
        socketRef.current?.emit("join chat", selectedChat._id);
        setTimeout(() => scrollToBottom("auto"), 50);
      } catch (err) {
        toast.error("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
    setNewMessage("");
    setAttachedFile(null);
    setEditingMessageId(null);
  }, [selectedChat, BackendUrl, token]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size cannot exceed 25MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    setAttachedFile({ file, previewUrl, type: isImage ? "image" : "document" });
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if ((!newMessage.trim() && !attachedFile) || isSendingRef.current) return;

    if (editingMessageId) {
      try {
        const { data } = await axios.put(
          `${BackendUrl}/api/messages/${editingMessageId}`,
          { content: newMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages((prev) =>
          prev.map((m) => (m._id === editingMessageId ? data : m))
        );
        socketRef.current?.emit("message edited", data);
        setEditingMessageId(null);
        setNewMessage("");
      } catch {
        toast.error("Failed to edit message");
      }
      return;
    }

    const contentToSend = newMessage;
    const fileToSend = attachedFile;

    isSendingRef.current = true;
    setIsSending(true);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      _id: tempId,
      content: contentToSend,
      sender: { _id: currentUserId, username: "You" },
      senderId: currentUserId,
      room: selectedChat._id,
      fileUrl: fileToSend ? fileToSend.previewUrl : null,
      fileType: fileToSend ? fileToSend.type : null,
      createdAt: new Date().toISOString(),
      readBy: [],
      deliveredTo: [],
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setAttachedFile(null);

    const textarea = document.getElementById("chat-textarea");
    if (textarea) {
      textarea.style.height = "auto";
    }

    scrollToBottom("smooth");

    try {
      socketRef.current?.emit("stop typing", selectedChat._id);
      let uploadedFileUrl = null;
      let uploadedFileType = null;

      if (fileToSend) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", fileToSend.file);

        const uploadRes = await axios.post(
          `${BackendUrl}/api/messages/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        uploadedFileUrl = uploadRes.data.url;
        uploadedFileType = uploadRes.data.fileType;
        setIsUploading(false);
      }

      const messagePayload = {
        roomId: selectedChat._id,
        content: contentToSend,
      };

      if (uploadedFileUrl) {
        messagePayload.fileUrl = uploadedFileUrl;
        messagePayload.fileType = uploadedFileType;
        if (!messagePayload.content) {
          messagePayload.content = fileToSend.file.name;
        }

        const fileName = fileToSend.file.name.toLowerCase();
        if (fileName.endsWith(".pdf") || fileName.endsWith(".txt") || fileToSend.file.type === "application/pdf") {
          try {
            await uploadSource(fileToSend.file);
          } catch (e) {
            console.warn("Knowledge source auto-upload warning:", e);
          }
        }
      }

      const { data } = await axios.post(
        `${BackendUrl}/api/messages`,
        messagePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => prev.map((m) => (m._id === tempId ? data : m)));
      socketRef.current?.emit("new message", data);
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setNewMessage(contentToSend);
      if (fileToSend) setAttachedFile(fileToSend);
      setIsUploading(false);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
      if (fileToSend) {
        URL.revokeObjectURL(fileToSend.previewUrl);
      }
    }
  };

  const initiateEdit = (msg) => {
    setEditingMessageId(msg._id);
    setNewMessage(msg.content);
    const textarea = document.getElementById("chat-textarea");
    if (textarea) {
      textarea.focus();
      textarea.style.height = "auto";
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage("");
  };

  const openDeleteModal = (msgId, msgSenderId) => {
    setMessageToDelete({ id: msgId, senderId: msgSenderId });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async (type) => {
    if (!messageToDelete) return;
    const { id: msgId } = messageToDelete;

    try {
      const { data } = await axios.delete(
        `${BackendUrl}/api/messages/${msgId}?type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (type === "everyone") {
        setMessages((prev) => prev.map((m) => (m._id === data._id ? data : m)));
        socketRef.current?.emit("message deleted", data);
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== msgId));
      }
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setDeleteModalOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear this chat for yourself?")) return;
    try {
      await axios.delete(`${BackendUrl}/api/messages/room/${selectedChat._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]);
      socketRef.current?.emit("chat cleared", { roomId: selectedChat._id, userId: currentUserId });
      setShowMenu(false);
    } catch {
      toast.error("Failed to clear chat");
    }
  };

  const getChatName = () => {
    if (selectedChat.isGroupChat) return selectedChat.name;
    const otherUser = selectedChat.members?.find((m) => String(m._id) !== String(currentUserId));
    return otherUser ? otherUser.username : "Unknown User";
  };

  return (
    <div className="flex flex-col w-full h-full bg-[var(--bg-chat)] overflow-hidden">
      {/* CONVERSATION HEADER (Height 60px, solid --bg-panel, 1px border) */}
      <div className="h-[60px] px-4 bg-[var(--bg-panel)] border-b border-[var(--border)] flex items-center justify-between z-10 select-none flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer p-1 -ml-1 mr-1"
            onClick={() => setSelectedChat(null)}
            aria-label="Back to chat list"
          >
            ←
          </button>

          <Avatar
            size="w-10 h-10"
            src={
              selectedChat.isGroupChat
                ? (selectedChat.profilePic || "/images/RoomChat.png")
                : selectedChat.members?.find((m) => String(m._id) !== String(currentUserId))?.profilePic
            }
            text={!selectedChat.isGroupChat ? getChatName().charAt(0).toUpperCase() : ""}
          />

          <div className="flex flex-col min-w-0">
            <h2 className="text-[16px] font-[500] text-[var(--text-primary)] leading-tight truncate">
              {getChatName()}
            </h2>
            <span className="text-[13px] text-[var(--text-secondary)] leading-none mt-0.5 truncate">
              {isTypingIndicatorVisible
                ? "typing..."
                : selectedChat.isGroupChat
                ? `${selectedChat.members?.length || 0} participants`
                : (() => {
                    const otherUser = selectedChat.members?.find((m) => String(m._id) !== String(currentUserId));
                    return otherUser && onlineUsers.includes(otherUser._id) ? "online" : "";
                  })()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quiz Me Button */}
          {readySourcesCount > 0 && (
            <button
              onClick={() => generateQuiz()}
              className="h-8 px-3 rounded-[8px] border border-[var(--border-strong)] bg-transparent hover:bg-[var(--bg-hover)] text-[13px] font-[500] text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Take an interactive quiz on uploaded documents"
            >
              <Sparkles size={16} className="text-[var(--accent)]" />
              <span className="hidden sm:inline">Quiz Me</span>
            </button>
          )}

          {/* CogniFlow AI Knowledge Hub Button */}
          <button
            onClick={() => setIsKnowledgePanelOpen(true)}
            className="h-8 px-3 rounded-[8px] border border-[var(--border-strong)] bg-transparent hover:bg-[var(--bg-hover)] text-[13px] font-[500] text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="CogniFlow AI Knowledge & Study Hub"
          >
            <Bot size={16} className="text-[var(--accent)]" />
            <span className="hidden sm:inline">Cogni AI</span>
            {readySourcesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[10px] font-semibold flex items-center justify-center">
                {readySourcesCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer text-sm outline-none"
              title="Menu"
            >
              <MoreVertical size={18} strokeWidth={1.75} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-44 py-1.5 bg-[var(--bg-panel)] rounded-[12px] shadow-[var(--shadow-md)] z-50 border border-[var(--border)] animate-[dropdownSlide_0.15s_cubic-bezier(0.2,0,0,1)]">
                {selectedChat.isGroupChat && (
                  <button
                    onClick={() => {
                      setIsGroupSettingsOpen(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[14px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                  >
                    Group Settings
                  </button>
                )}
                <button
                  onClick={handleClearChat}
                  className="w-full text-left px-3.5 py-2 text-[14px] text-[var(--danger)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  Clear Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <GroupSettingsModal
        isOpen={isGroupSettingsOpen}
        onClose={() => setIsGroupSettingsOpen(false)}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
      />

      {/* MESSAGES AREA */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:px-8 flex flex-col relative bg-[var(--bg-chat)]" 
        onClick={() => setShowMenu(false)}
      >
        <div className="max-w-[860px] w-full mx-auto flex flex-col flex-1">
          {loadingMessages ? (
            <p className="text-center text-[var(--text-secondary)] mt-10 text-[13px]">
              Loading chat history...
            </p>
          ) : messages.length === 0 ? (
            (() => {
              const otherUser = !selectedChat.isGroupChat ? selectedChat.members?.find((m) => String(m._id) !== String(currentUserId)) : null;
              const isCogniBot = otherUser && (otherUser.username === "CogniBot" || otherUser.email === "cognibot@system.local");

              if (isCogniBot) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 mb-3 rounded-full bg-[var(--bg-panel)] border border-[var(--border)] flex items-center justify-center p-2.5">
                      <img src="/images/CogniFlow.png" alt="CogniBot" className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">
                      CogniBot Knowledge Assistant
                    </h3>
                    <p className="text-[13px] text-[var(--text-secondary)] max-w-sm mt-1 mb-5">
                      Upload PDFs or documents to ask questions with citations, or test your comprehension with interactive quizzes.
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsKnowledgePanelOpen(true)}
                        className="px-3.5 py-1.5 rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-panel)] text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      >
                        Knowledge Base
                      </button>
                      <button
                        onClick={() => {
                          if (readySourcesCount > 0) generateQuiz();
                          else setIsKnowledgePanelOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-[8px] bg-[var(--accent)] text-white text-[13px] font-medium hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
                      >
                        Quiz Me
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-[var(--text-secondary)] select-none">
                  <p className="text-[14px]">No messages yet. Send a message to start chatting.</p>
                </div>
              );
            })()
          ) : (
            messages.map((m, index) => {
              const senderId = m.sender?._id || m.sender?.id || m.sender;
              const isMyMessage = String(senderId) === String(currentUserId);
              const isDeleted = m.isDeleted;

              // Date Divider Logic
              const messageDate = new Date(m.createdAt);
              const isToday = messageDate.toDateString() === new Date().toDateString();
              const isYesterday = messageDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
              
              let dateLabel = messageDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
              if (isToday) dateLabel = "Today";
              else if (isYesterday) dateLabel = "Yesterday";

              let showDateDivider = false;
              if (index === 0) {
                showDateDivider = true;
              } else {
                const prevDate = new Date(messages[index - 1].createdAt);
                if (prevDate.toDateString() !== messageDate.toDateString()) {
                  showDateDivider = true;
                }
              }

              const prevMessage = index > 0 ? messages[index - 1] : null;
              const isFirstInGroup = !prevMessage || String(prevMessage.sender?._id || prevMessage.sender?.id || prevMessage.sender) !== String(senderId) || showDateDivider;

              const timeString = messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <React.Fragment key={m._id}>
                  {showDateDivider && (
                    <div className="flex justify-center my-3 select-none">
                      <div className="bg-[var(--bg-panel)] px-3 py-1 rounded-[8px] text-[12px] font-[500] text-[var(--text-secondary)] shadow-[var(--shadow-sm)] border border-[var(--border)]">
                        {dateLabel}
                      </div>
                    </div>
                  )}

                  <div className={`flex w-full group ${isMyMessage ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-2.5" : "mt-0.5"}`}>
                    <div className="relative max-w-[85%] sm:max-w-[65%] flex flex-col">
                      {/* Sender name in group chats if incoming and first in group */}
                      {!isMyMessage && selectedChat.isGroupChat && isFirstInGroup && (
                        <span
                          className="text-[12.5px] font-[500] mb-0.5 ml-2 leading-none"
                          style={{ color: getSenderColor(String(senderId)) }}
                        >
                          {m.sender?.username || "Member"}
                        </span>
                      )}

                      {/* Edit/Delete message hover menu */}
                      {isMyMessage && !isDeleted && (
                        <div className="absolute -left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-20">
                          <button 
                            onClick={() => initiateEdit(m)}
                            className="p-1 rounded-full bg-[var(--bg-panel)] border border-[var(--border)] shadow-[var(--shadow-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(m._id, senderId)}
                            className="p-1 rounded-full bg-[var(--bg-panel)] border border-[var(--border)] shadow-[var(--shadow-sm)] text-[var(--text-secondary)] hover:text-[var(--danger)] cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}

                      {/* Message Bubble Container */}
                      <div
                        className={`
                          relative p-2 px-3 text-[14.5px] leading-relaxed break-words
                          ${
                            isDeleted
                              ? "bg-[var(--bg-panel)] text-[var(--text-tertiary)] italic rounded-[8px] border border-[var(--border)]"
                              : isMyMessage
                              ? `bg-[var(--bubble-out)] text-[var(--bubble-out-text)] ${isFirstInGroup ? "bubble-tail-out rounded-[8px]" : "rounded-[8px]"}`
                              : `bg-[var(--bubble-in)] text-[var(--bubble-in-text)] shadow-[var(--shadow-sm)] ${isFirstInGroup ? "bubble-tail-in rounded-[8px]" : "rounded-[8px]"}`
                          }
                        `}
                      >
                        {isDeleted ? (
                          <span>This message was deleted</span>
                        ) : m.fileUrl && m.fileType === "image" ? (
                          <div className="flex flex-col gap-1.5">
                            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={m.fileUrl}
                                alt="Attachment"
                                className="max-w-full max-h-[320px] rounded-[6px] object-cover"
                              />
                            </a>
                            {m.content && m.content !== "image" && (
                              <p className="text-[14.5px] leading-normal">{m.content}</p>
                            )}
                          </div>
                        ) : m.fileUrl ? (
                          (() => {
                            const isAutoGeneratedName = m.content && (
                              m.content === m.fileUrl.split('/').pop() ||
                              m.content.endsWith('.pdf') ||
                              m.content.endsWith('.doc') ||
                              m.content.endsWith('.docx') ||
                              m.content.endsWith('.txt')
                            );
                            const hasPromptText = m.content && !isAutoGeneratedName;
                            const docName = isAutoGeneratedName ? m.content : (m.fileUrl.split('/').pop() || "Document");

                            return (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3 p-2 rounded-[8px] bg-[var(--bg-input)] border border-[var(--border)]">
                                  <div className="w-10 h-10 rounded-[6px] bg-[var(--bg-panel)] text-[var(--text-secondary)] flex items-center justify-center flex-shrink-0">
                                    <FileText size={20} strokeWidth={1.75} />
                                  </div>
                                  <div className="flex-1 min-w-0 pr-1">
                                    <div className="text-[14px] font-[500] truncate text-[var(--text-primary)]" title={docName}>
                                      {docName}
                                    </div>
                                    <div className="text-[12px] text-[var(--text-secondary)]">
                                      Document · Click to view
                                    </div>
                                  </div>
                                  <a
                                    href={m.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 flex-shrink-0"
                                    title="Download"
                                  >
                                    <Download size={18} strokeWidth={1.75} />
                                  </a>
                                </div>

                                {hasPromptText && (
                                  <div className="text-[14.5px] leading-normal">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {m.content}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : m.messageType === "quiz" && m.quizData ? (
                          <div className="flex flex-col gap-2">
                            <QuizCard quiz={m.quizData} messageId={m._id} />
                          </div>
                        ) : (
                          <>
                            {m.isAiResponse && (
                              <div className="text-[12.5px] font-[500] text-[var(--accent)] mb-1">
                                CogniBot
                              </div>
                            )}
                            {m.isAiResponse && <AnswerBadge answerMode={m.answerMode} />}
                            <div className="markdown-body text-[14.5px] leading-relaxed [&>p]:mb-1.5 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-2 [&>h1]:text-[15px] [&>h1]:font-semibold [&>h2]:text-[15px] [&>h2]:font-semibold [&_code]:bg-[var(--bg-input)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded-[4px] [&_code]:text-[13px] break-words">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p({ children }) {
                                    return (
                                      <p className="mb-1.5 last:mb-0">
                                        {React.Children.map(children, (child) => {
                                          if (typeof child === "string" && /@cogni\b/i.test(child)) {
                                            const parts = child.split(/(@cogni\b)/gi);
                                            return parts.map((part, i) =>
                                              part.toLowerCase() === "@cogni" ? (
                                                <span
                                                  key={i}
                                                  className="inline-flex items-center gap-0.5 px-1 rounded-[4px] font-medium text-[13px] text-[var(--accent)] bg-[var(--accent-soft)]"
                                                >
                                                  @cogni
                                                </span>
                                              ) : (
                                                part
                                              )
                                            );
                                          }
                                          return child;
                                        })}
                                      </p>
                                    );
                                  },
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>
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
                          </>
                        )}

                        {/* Timestamp & Receipts */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-[var(--text-tertiary)] select-none">
                          {m.isEdited && !isDeleted && <span>(edited)</span>}
                          <span>{timeString}</span>
                          {isMyMessage && !isDeleted && (
                            <span className="ml-0.5 flex items-center">
                              {m.isOptimistic ? (
                                <span className="text-[10px]">sending...</span>
                              ) : m.readBy?.length > 0 ? (
                                <CheckCheck size={15} strokeWidth={2} className="text-[var(--tick-seen)]" />
                              ) : m.deliveredTo?.length > 0 ? (
                                <CheckCheck size={15} strokeWidth={2} className="text-[var(--tick-sent)]" />
                              ) : (
                                <Check size={15} strokeWidth={2} className="text-[var(--tick-sent)]" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}

          {/* Typing Indicator (§4.8 neutral 3-dot bubble) */}
          {isTypingIndicatorVisible && (
            <div className="flex justify-start w-full mt-2 mb-2">
              <div className="bg-[var(--bubble-in)] px-3.5 py-2.5 rounded-[8px] shadow-[var(--shadow-sm)] border border-[var(--border)] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce" />
              </div>
            </div>
          )}

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              className="sticky bottom-3 ml-auto mr-1 z-30 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border)] shadow-[var(--shadow-md)] text-[12px] font-medium cursor-pointer transition-all"
              title="Scroll to latest messages"
            >
              <ChevronDown size={14} />
              {unreadWhileScrolled > 0 ? (
                <span>{unreadWhileScrolled} new</span>
              ) : (
                <span>Latest</span>
              )}
            </button>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* EDITING BANNER */}
      {editingMessageId && (
        <div className="bg-[var(--bg-panel)] px-4 py-2 border-t border-[var(--border)] flex justify-between items-center z-10">
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-[var(--accent)]">Editing Message</span>
            <span className="text-[12px] text-[var(--text-secondary)]">Press Esc to cancel</span>
          </div>
          <button 
            onClick={cancelEdit}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-full cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ATTACHMENT PREVIEW TRAY */}
      {attachedFile && (
        <div className="px-4 py-2 bg-[var(--bg-panel)] border-t border-[var(--border)] flex items-center justify-between z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            {attachedFile.type === "image" ? (
              <img src={attachedFile.previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-[8px] border border-[var(--border)]" />
            ) : (
              <div className="w-12 h-12 bg-[var(--bg-input)] rounded-[8px] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)]">
                <FileText size={22} />
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">{attachedFile.file.name}</span>
              <span className="text-[12px] text-[var(--text-secondary)]">{(attachedFile.file.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setAttachedFile(null);
              URL.revokeObjectURL(attachedFile.previewUrl);
            }}
            className="w-6 h-6 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer"
            aria-label="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* INPUT BAR (Height 62px min, --bg-input background, 1px top border) */}
      <div className="min-h-[62px] px-4 py-2 bg-[var(--bg-input)] border-t border-[var(--border)] flex items-end gap-2 z-10 flex-shrink-0">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />

        {/* Attach File Button */}
        <button 
          onClick={() => document.getElementById("file-upload").click()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer flex-shrink-0 mb-0.5"
          title="Attach file"
        >
          <Paperclip size={20} strokeWidth={1.75} />
        </button>

        {/* CogniBot Quick Mention Button */}
        <button
          type="button"
          onClick={() => {
            setNewMessage((prev) => (prev.includes("@cogni") ? prev : (prev ? `@cogni ${prev}` : "@cogni ")));
            document.getElementById("chat-textarea")?.focus();
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer flex-shrink-0 mb-0.5"
          title="Ask CogniBot (@cogni)"
        >
          <Sparkles size={20} strokeWidth={1.75} />
        </button>

        {/* Text Area Pill Container (rounded-full 20px pill, --bg-panel background) */}
        <div className="flex-1 min-h-[40px] bg-[var(--bg-panel)] rounded-[20px] px-4 py-2 border border-transparent focus-within:border-[var(--border-strong)] flex items-center transition-colors mb-0.5">
          <textarea
            id="chat-textarea"
            rows={1}
            value={newMessage}
            placeholder="Type a message"
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (selectedChatRef.current) {
                socketRef.current?.emit("typing", selectedChatRef.current._id);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  socketRef.current?.emit("stop typing", selectedChatRef.current._id);
                }, 3000);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isSendingRef.current) {
                  handleSubmit();
                }
              } else if (e.key === "Escape" && editingMessageId) {
                e.preventDefault();
                cancelEdit();
              }
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            className="w-full bg-transparent border-none outline-none resize-none overflow-y-auto text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-[15px] leading-normal"
            spellCheck="false"
          />
        </div>

        {/* Send Button (40px circle) */}
        <button
          onClick={handleSubmit}
          disabled={isSending || (!newMessage.trim() && !attachedFile)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 cursor-pointer ${
            !newMessage.trim() && !attachedFile
              ? "text-[var(--text-tertiary)] cursor-default"
              : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
          }`}
          title={isSending ? "Sending..." : "Send message"}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={18} strokeWidth={2} className="ml-0.5" />
          )}
        </button>
      </div>

      <DeleteMessageModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        canDeleteForEveryone={
          messageToDelete && (
            String(messageToDelete.senderId) === String(currentUserId) ||
            (selectedChat && selectedChat.isGroupChat && (
              String(selectedChat.admin) === String(currentUserId) ||
              String(selectedChat.admin?._id) === String(currentUserId)
            ))
          )
        }
      />

      {/* Knowledge Panel Slide-over */}
      <KnowledgePanel
        isOpen={isKnowledgePanelOpen}
        onClose={() => setIsKnowledgePanelOpen(false)}
        sources={sources}
        ragMode={ragMode}
        isUploading={isKnowledgeUploading}
        uploadProgress={uploadProgress}
        onUploadFile={uploadSource}
        onUploadText={uploadText}
        onToggleSource={toggleSource}
        onDeleteSource={deleteSource}
        onUpdateMode={updateMode}
        onGenerateQuiz={generateQuiz}
      />

      {/* Learn from Answer Modal */}
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

export default ChatContainer;
