import React, { useState, useRef, useEffect } from "react";
import { Plus, Sun, Moon, Settings, MoreVertical, LogOut, MessageSquarePlus, Bot } from "lucide-react";
import Avatar from "../ui/Avatar";

const SidebarHeader = ({
  user,
  onSettingsClick,
  onNewGroupClick,
  onChatWithCogniBot,
  onToggleTheme,
  onLogout,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNewChatMenu, setShowNewChatMenu] = useState(false);
  const menuRef = useRef(null);
  const newChatRef = useRef(null);

  const isDarkMode = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (newChatRef.current && !newChatRef.current.contains(e.target)) {
        setShowNewChatMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-[60px] px-4 flex items-center justify-between bg-[var(--bg-panel)] border-b border-[var(--border)] select-none">
      {/* Left: User Avatar (40px) */}
      <button
        type="button"
        onClick={onSettingsClick}
        className="flex items-center gap-3 p-0 border-none bg-transparent cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        title="View profile & settings"
      >
        <Avatar
          size="w-10 h-10"
          src={user?.profilePic}
          text={user?.username?.charAt(0).toUpperCase() || "U"}
        />
      </button>

      {/* Right: Icon Buttons (40x40, 20px icons, secondary color) */}
      <div className="flex items-center gap-1 text-[var(--text-secondary)]">
        {/* New Chat (+) */}
        <div className="relative" ref={newChatRef}>
          <button
            type="button"
            onClick={() => setShowNewChatMenu(!showNewChatMenu)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer outline-none"
            title="New chat or group"
          >
            <Plus size={20} strokeWidth={1.75} />
          </button>

          {showNewChatMenu && (
            <div className="absolute right-0 top-11 w-48 py-1.5 bg-[var(--bg-panel)] rounded-[12px] border border-[var(--border)] shadow-[var(--shadow-md)] z-50 animate-[dropdownSlide_0.15s_cubic-bezier(0.2,0,0,1)]">
              <button
                type="button"
                onClick={() => {
                  setShowNewChatMenu(false);
                  onNewGroupClick();
                }}
                className="w-full h-10 px-3.5 flex items-center gap-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <MessageSquarePlus size={18} strokeWidth={1.75} className="text-[var(--text-secondary)]" />
                <span>New group</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewChatMenu(false);
                  onChatWithCogniBot();
                }}
                className="w-full h-10 px-3.5 flex items-center gap-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <Bot size={18} strokeWidth={1.75} className="text-[var(--accent)]" />
                <span>Chat with CogniBot</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer outline-none"
          title="Toggle theme"
        >
          {isDarkMode ? (
            <Sun size={20} strokeWidth={1.75} />
          ) : (
            <Moon size={20} strokeWidth={1.75} />
          )}
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onSettingsClick}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer outline-none"
          title="Settings"
        >
          <Settings size={20} strokeWidth={1.75} />
        </button>

        {/* Overflow Menu (⋮) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer outline-none"
            title="Menu"
          >
            <MoreVertical size={20} strokeWidth={1.75} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-11 w-44 py-1.5 bg-[var(--bg-panel)] rounded-[12px] border border-[var(--border)] shadow-[var(--shadow-md)] z-50 animate-[dropdownSlide_0.15s_cubic-bezier(0.2,0,0,1)]">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onNewGroupClick();
                }}
                className="w-full h-10 px-3.5 flex items-center gap-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <span>New group</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onSettingsClick();
                }}
                className="w-full h-10 px-3.5 flex items-center gap-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <span>Settings</span>
              </button>
              <div className="my-1 border-t border-[var(--border)]"></div>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onLogout();
                }}
                className="w-full h-10 px-3.5 flex items-center gap-2.5 text-[14px] text-[var(--danger)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <LogOut size={16} strokeWidth={1.75} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
