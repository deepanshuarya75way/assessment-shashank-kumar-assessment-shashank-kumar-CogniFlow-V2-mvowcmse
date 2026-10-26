import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import RoomSideBar from "../components/sidebar/Sidebar";
import ChatContainer from "../components/chat/ChatContainer";

const Dashboard = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)]">
      {/* SIDEBAR */}
      <div
        className={`
          ${selectedChat ? "hidden md:flex" : "flex"}
          w-full md:w-[380px] shrink-0 h-full
          border-r border-[var(--border)]
          bg-[var(--bg-panel)]
          flex-col
        `}
      >
        <RoomSideBar
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          setOnlineUsers={setOnlineUsers}
          onlineUsers={onlineUsers}
        />
      </div>

      {/* CHAT AREA */}
      <div
        className={`
          ${selectedChat ? "flex" : "hidden md:flex"}
          flex-1 h-full flex-col overflow-hidden bg-[var(--bg-chat)]
        `}
      >
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-app)] select-none">
            <div className="w-16 h-16 mb-4 text-[var(--text-tertiary)] flex items-center justify-center">
              <MessageSquare size={56} strokeWidth={1.5} />
            </div>
            <h2 className="text-[22px] font-medium text-[var(--text-primary)] tracking-[-0.01em]">
              CogniFlow for Web
            </h2>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)] max-w-sm leading-relaxed">
              Select a chat to start messaging, or type @cogni in any group to ask the assistant.
            </p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col overflow-hidden">
            <ChatContainer
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              onlineUsers={onlineUsers}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
