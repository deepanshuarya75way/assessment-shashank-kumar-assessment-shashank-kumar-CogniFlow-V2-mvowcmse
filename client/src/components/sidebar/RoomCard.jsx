import React from "react";
import { Check, CheckCheck, HelpCircle } from "lucide-react";
import Avatar from "../ui/Avatar";

const cleanPreview = (message) => {
  if (!message) return "No messages yet";
  if (message.messageType === "quiz" || message.quizData) {
    const topic = message.quizData?.topic || "Interactive Quiz";
    return `Quiz: ${topic.replace(/[*#_`]/g, "").trim()}`;
  }
  let content = message.content || "";
  content = content.replace(/[*#_`~>]/g, "").trim();
  content = content.replace(/\s+/g, " ");
  return content || (message.fileUrl ? "Document / Attachment" : "No messages yet");
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const RoomCard = ({
  room,
  currentUserId,
  selectedChat,
  setSelectedChat,
  getUnreadCount,
  onlineUsers = [],
}) => {
  const getOtherUser = (members = []) =>
    members.find((m) => String(m._id) !== String(currentUserId));

  const otherUser = !room.isGroupChat ? getOtherUser(room.members) : null;
  const unreadCount = getUnreadCount ? getUnreadCount(room._id) : 0;
  
  const isOnline = !room.isGroupChat && otherUser && onlineUsers.includes(otherUser._id);
  const isSelected = selectedChat?._id === room._id;
  const isCogniBot = otherUser && (otherUser.username === "CogniBot" || otherUser.email === "cognibot@system.local");

  const displayName = room.isGroupChat ? room.name : otherUser?.username || "Unknown";
  const timeString = formatTime(room.lastMessage?.createdAt);
  const isOutgoing = room.lastMessage && String(room.lastMessage.sender?._id || room.lastMessage.sender) === String(currentUserId);
  const isSeen = room.lastMessage?.readBy?.length > 0;
  const isDelivered = room.lastMessage?.deliveredTo?.length > 0;

  return (
    <div
      onClick={() => setSelectedChat(room)}
      className={`
        relative flex items-center h-[72px] px-4 cursor-pointer select-none
        transition-colors duration-150 ease-out
        ${isSelected ? "bg-[var(--bg-selected)]" : "bg-transparent hover:bg-[var(--bg-hover)]"}
      `}
    >
      {/* Avatar 48px */}
      <div className="relative flex-shrink-0 mr-4">
        {isCogniBot ? (
          <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center p-2">
            <img src="/images/CogniFlow.png" alt="CogniBot" className="w-full h-full object-contain" />
          </div>
        ) : (
          <Avatar
            size="w-12 h-12"
            src={room.isGroupChat ? (room.profilePic || "/images/RoomChat.png") : otherUser?.profilePic}
            text={!room.isGroupChat ? displayName.charAt(0).toUpperCase() : ""}
          />
        )}
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--accent)] border-2 border-[var(--bg-panel)] rounded-full"></div>
        )}
      </div>

      {/* Info Rows */}
      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
        {/* Row 1: Name + Time */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <span className="text-[16px] font-[500] text-[var(--text-primary)] truncate leading-tight">
              {displayName}
            </span>
            {isCogniBot && (
              <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent)] uppercase tracking-wide flex-shrink-0">
                AI
              </span>
            )}
          </div>
          {timeString && (
            <span className={`text-[12px] flex-shrink-0 ${unreadCount > 0 ? "text-[var(--accent)] font-medium" : "text-[var(--text-tertiary)]"}`}>
              {timeString}
            </span>
          )}
        </div>

        {/* Row 2: Preview + Unread Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0 pr-2 text-[14px] text-[var(--text-secondary)]">
            {isOutgoing && (
              <span className="flex-shrink-0">
                {isSeen ? (
                  <CheckCheck size={16} strokeWidth={2} className="text-[var(--tick-seen)]" />
                ) : isDelivered ? (
                  <CheckCheck size={16} strokeWidth={2} className="text-[var(--tick-sent)]" />
                ) : (
                  <Check size={16} strokeWidth={2} className="text-[var(--tick-sent)]" />
                )}
              </span>
            )}
            <span className="truncate leading-normal">
              {cleanPreview(room.lastMessage)}
            </span>
          </div>

          {unreadCount > 0 && (
            <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--accent)] text-white text-[12px] font-semibold flex items-center justify-center flex-shrink-0">
              {unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* Inset Divider (start line at x = 80px: avatar 48px + px-4 16px + mr-4 16px) */}
      <div className="absolute bottom-0 right-0 left-[80px] border-b border-[var(--border)]"></div>
    </div>
  );
};

export default RoomCard;