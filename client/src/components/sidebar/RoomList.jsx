import React from "react";
import RoomCard from "./RoomCard";

const RoomList = ({
  isLoading,
  rooms,
  currentUserId,
  selectedChat,
  setSelectedChat,
  getUnreadCount,
  onlineUsers,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center h-[72px] px-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] mr-4 flex-shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
              <div className="h-3.5 bg-[var(--bg-hover)] rounded w-1/3" />
              <div className="h-3 bg-[var(--bg-hover)] rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[14px] text-[var(--text-secondary)]">
        No chats yet. Start a new conversation above.
      </div>
    );
  }

  return rooms.map((room) => (
    <RoomCard
      key={room._id}
      room={room}
      currentUserId={currentUserId}
      selectedChat={selectedChat}
      setSelectedChat={setSelectedChat}
      getUnreadCount={getUnreadCount}
      onlineUsers={onlineUsers}
    />
  ));
};

export default RoomList;
