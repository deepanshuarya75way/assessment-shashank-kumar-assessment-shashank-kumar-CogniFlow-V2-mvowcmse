import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import SidebarHeader from "./SidebarHeader";
import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";
import RoomList from "./RoomList";
import RoomModal from "./RoomModal";
import { getBackendUrl, createResilientSocket } from "../../utils/apiConfig";
import { getAuthToken, getAuthUserId, clearAuthSession } from "../../utils/authStorage";

const Sidebar = ({ selectedChat, setSelectedChat, onlineUsers, setOnlineUsers }) => {
  const navigate = useNavigate();
  const BackendUrl = getBackendUrl();

  const socketRef = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const currentUserId = getAuthUserId();
  const token = getAuthToken();
  const selectedChatRef = useRef(selectedChat);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Fetch current user profile for avatar in header
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${BackendUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserProfile(data);
      } catch {
        // Fallback gracefully
      }
    };
    if (token) fetchProfile();
  }, [BackendUrl, token]);

  useEffect(() => {
    socketRef.current = createResilientSocket();

    socketRef.current.on("connect", () => {
      socketRef.current.emit("setup", currentUserId);
    });

    socketRef.current.on("get online users", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("message received", (newMessage) => {
      const roomId = newMessage.room?._id || newMessage.room;

      if (!selectedChatRef.current || String(selectedChatRef.current._id) !== String(roomId)) {
        setNotifications((prev) => {
          if (prev.some((n) => n._id === newMessage._id)) return prev;
          return [newMessage, ...prev];
        });
      }

      setRooms((prevRooms) => {
        const roomIndex = prevRooms.findIndex((r) => String(r._id) === String(roomId));
        
        if (roomIndex > -1) {
          const updatedRooms = [...prevRooms];
          const updatedRoom = { ...updatedRooms[roomIndex], lastMessage: newMessage };
          
          updatedRooms.splice(roomIndex, 1);
          updatedRooms.unshift(updatedRoom);
          
          return updatedRooms;
        } else if (newMessage.room && typeof newMessage.room === "object") {
          return [{ ...newMessage.room, lastMessage: newMessage }, ...prevRooms];
        }
        
        return prevRooms;
      });
    });

    return () => socketRef.current?.disconnect();
  }, [BackendUrl, currentUserId]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await axios.get(`${BackendUrl}/api/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(data);
      } catch {
        toast.error("Failed to load chats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [BackendUrl, token]);

  const getUnreadCount = (roomId) => {
    const room = rooms.find((r) => r._id === roomId);
    const dbCount = room?.unreadCounts?.[currentUserId] || 0;
    const socketCount = notifications.filter((n) => (n.room._id || n.room) === roomId).length;
    return dbCount + socketCount;
  };

  const handleSelectChat = async (room) => {
    setSelectedChat(room);

    setNotifications((prev) =>
      prev.filter((n) => (n.room._id || n.room) !== room._id)
    );

    setRooms((prev) =>
      prev.map((r) => {
        if (r._id === room._id) {
          return { ...r, unreadCounts: { ...r.unreadCounts, [currentUserId]: 0 } };
        }
        return r;
      })
    );

    try {
      await axios.put(`${BackendUrl}/api/chat/${room._id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Ignore
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearch(query);

    if (!query) return setSearchResult([]);

    try {
      setLoadingSearch(true);
      const { data } = await axios.get(
        `${BackendUrl}/api/user?search=${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResult(data);
    } catch {
      toast.error("Search failed");
    } finally {
      setLoadingSearch(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      const { data } = await axios.post(
        `${BackendUrl}/api/chat`,
        { isGroupChat: false, members: [userId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!rooms.find((r) => r._id === data._id)) {
        setRooms([data, ...rooms]);
      }

      setSearch("");
      setSearchResult([]);
      return data;
    } catch {
      toast.error("Error creating chat");
      return null;
    }
  };

  const handleChatWithCogniBot = async () => {
    try {
      const { data } = await axios.get(
        `${BackendUrl}/api/user?search=CogniBot`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data && data.length > 0) {
        const room = await accessChat(data[0]._id);
        if (room) {
          handleSelectChat(room);
        }
      } else {
        toast.error("CogniBot not found");
      }
    } catch {
      toast.error("Could not reach CogniBot");
    }
  };

  const handleToggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    if (isDark) {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/");
  };

  return (
    <div className="h-full w-full bg-[var(--bg-panel)] flex flex-col overflow-hidden">
      <SidebarHeader
        user={currentUserProfile}
        onSettingsClick={() => navigate("/profile")}
        onNewGroupClick={() => setIsRoomModalOpen(true)}
        onChatWithCogniBot={handleChatWithCogniBot}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        rooms={rooms}
        setRooms={setRooms}
      />

      <SearchBar
        search={search}
        setSearch={setSearch}
        setSearchResult={setSearchResult}
        handleSearch={handleSearch}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {search ? (
          <SearchResults
            loadingSearch={loadingSearch}
            searchResult={searchResult}
            accessChat={accessChat}
            onSelectChat={handleSelectChat}
          />
        ) : (
          <RoomList
            isLoading={isLoading}
            rooms={rooms}
            currentUserId={currentUserId}
            selectedChat={selectedChat}
            setSelectedChat={handleSelectChat}
            getUnreadCount={getUnreadCount}
            onlineUsers={onlineUsers}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;