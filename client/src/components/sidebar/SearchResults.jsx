import React from "react";
import Avatar from "../ui/Avatar";

const SearchResults = ({ loadingSearch, searchResult, accessChat, onSelectChat }) => {
  if (loadingSearch) {
    return (
      <div className="p-6 text-center text-[13px] text-[var(--text-secondary)]">
        Searching users...
      </div>
    );
  }

  if (searchResult.length === 0) {
    return (
      <div className="p-6 text-center text-[13px] text-[var(--text-secondary)]">
        No users found
      </div>
    );
  }

  return searchResult.map((user) => (
    <div
      key={user._id}
      onClick={async () => {
        const room = await accessChat(user._id);
        if (room && onSelectChat) {
          onSelectChat(room);
        }
      }}
      className="relative flex items-center h-[68px] px-4 cursor-pointer select-none hover:bg-[var(--bg-hover)] transition-colors duration-150"
    >
      <div className="mr-3 flex-shrink-0">
        <Avatar
          size="w-11 h-11"
          src={user.profilePic}
          text={user.username?.charAt(0).toUpperCase()}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[15px] font-[500] text-[var(--text-primary)] truncate">
          {user.username}
        </p>
        <p className="text-[13px] text-[var(--text-secondary)] truncate">
          {user.bio || "Available"}
        </p>
      </div>

      <div className="absolute bottom-0 right-0 left-[68px] border-b border-[var(--border)]"></div>
    </div>
  ));
};

export default SearchResults;
