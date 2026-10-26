import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Avatar from "../ui/Avatar";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, X, Check } from "lucide-react";
import { getBackendUrl } from "../../utils/apiConfig";
import { getAuthToken, getAuthUserId } from "../../utils/authStorage";

const GroupSettingsModal = ({ isOpen, onClose, selectedChat, setSelectedChat }) => {
  if (!isOpen || !selectedChat) return null;

  const BackendUrl = getBackendUrl();
  const token = getAuthToken();
  const currentUserId = getAuthUserId();

  const [roomName, setRoomName] = useState(selectedChat.name || "");
  const [profilePic, setProfilePic] = useState(selectedChat.profilePic || "");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Cropping State
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [isUploadingCrop, setIsUploadingCrop] = useState(false);

  const isAdmin = 
    String(selectedChat.admin) === String(currentUserId) || 
    String(selectedChat.admin?._id) === String(currentUserId);

  useEffect(() => {
    setRoomName(selectedChat.name);
    setProfilePic(selectedChat.profilePic || "");
  }, [selectedChat]);

  // Image Cropping Logic
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () => setImgSrc(reader.result.toString() || ""));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
      width, height
    );
    setCrop(initialCrop);
  };

  const generateCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return null;
    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleUploadCrop = async () => {
    try {
      setIsUploadingCrop(true);
      const croppedBlob = await generateCroppedImage();
      if (!croppedBlob) {
        toast.error("Failed to crop image");
        return;
      }

      const formData = new FormData();
      formData.append("file", croppedBlob, "group-profile.jpg");

      const res = await axios.post(`${BackendUrl}/api/messages/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      const newUrl = res.data.url;
      setProfilePic(newUrl);

      const updateRes = await axios.put(
        `${BackendUrl}/api/chat/group/photo`,
        { chatId: selectedChat._id, profilePic: newUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedChat(updateRes.data);
      setImgSrc("");
      toast.success("Group picture updated!");
    } catch {
      toast.error("Failed to update picture");
    } finally {
      setIsUploadingCrop(false);
    }
  };

  const handleRename = async () => {
    if (!roomName.trim() || roomName === selectedChat.name) return;
    try {
      setUpdating(true);
      const { data } = await axios.put(
        `${BackendUrl}/api/chat/rename`,
        { chatId: selectedChat._id, chatName: roomName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedChat(data);
      toast.success("Group name updated!");
    } catch {
      toast.error("Failed to rename group");
    } finally {
      setUpdating(false);
    }
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResult([]);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(`${BackendUrl}/api/user?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResult(data);
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userToAdd) => {
    if (selectedChat.members.find((u) => u._id === userToAdd._id)) {
      toast.error("User is already in group");
      return;
    }

    try {
      setUpdating(true);
      const { data } = await axios.put(
        `${BackendUrl}/api/chat/groupadd`,
        { chatId: selectedChat._id, userId: userToAdd._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedChat(data);
      setSearch("");
      setSearchResult([]);
      toast.success(`${userToAdd.username} added!`);
    } catch {
      toast.error("Failed to add user");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveUser = async (userToRemove) => {
    try {
      setUpdating(true);
      const { data } = await axios.put(
        `${BackendUrl}/api/chat/groupremove`,
        { chatId: selectedChat._id, userId: userToRemove._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedChat(data);
      toast.success(`${userToRemove.username} removed!`);
    } catch {
      toast.error("Failed to remove user");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,20,26,0.5)] p-4 animate-[modalBackdrop_0.15s_ease-out]">
      {/* Cropping Modal */}
      {imgSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(11,20,26,0.6)] p-4 animate-[modalBackdrop_0.15s_ease-out]">
          <div className="bg-[var(--bg-panel)] p-6 rounded-[14px] border border-[var(--border)] shadow-[var(--shadow-md)] max-w-lg w-full flex flex-col items-center animate-[modalContent_0.15s_cubic-bezier(0.2,0,0,1)]">
            <h2 className="text-[18px] font-semibold mb-4 text-[var(--text-primary)]">Crop Picture</h2>
            <div className="max-h-[60vh] overflow-hidden w-full bg-black rounded-[10px] flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-[60vh] object-contain block"
                />
              </ReactCrop>
            </div>
            <div className="flex gap-3 mt-6 w-full">
              <button
                type="button"
                onClick={() => setImgSrc("")}
                className="flex-1 h-10 rounded-[10px] border border-[var(--border-strong)] text-[var(--text-primary)] font-medium text-[14px] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X size={16} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadCrop}
                disabled={isUploadingCrop || !completedCrop}
                className="flex-1 h-10 rounded-[10px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-[14px] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isUploadingCrop ? "Processing..." : <><Check size={16} /> Apply</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[var(--bg-panel)] w-full max-w-[440px] p-6 rounded-[14px] border border-[var(--border)] shadow-[var(--shadow-md)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto scrollbar-hide animate-[modalContent_0.15s_cubic-bezier(0.2,0,0,1)] relative">
        <div className="flex justify-between items-center">
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)] tracking-tight">Group settings</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Group Picture */}
        <div className="flex flex-col items-center gap-2">
          <div className={`relative ${isAdmin ? 'group cursor-pointer' : ''}`} onClick={() => isAdmin && document.getElementById("edit-group-pic").click()}>
            <div className="w-20 h-20 rounded-full border border-[var(--border)] p-1 bg-[var(--bg-input)] transition-transform duration-150">
              <Avatar src={profilePic} text={roomName ? roomName.charAt(0).toUpperCase() : "G"} size="w-full h-full" />
            </div>
            {isAdmin && (
              <>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={22} className="text-white" />
                </div>
                <input type="file" id="edit-group-pic" className="hidden" accept="image/*" onChange={onSelectFile} disabled={updating} />
              </>
            )}
          </div>
          <span className="text-[12px] text-[var(--text-secondary)]">
            {isAdmin ? "Click to change picture" : "Group picture"}
          </span>
        </div>

        {/* Rename Group */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[var(--text-secondary)]">Group name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={!isAdmin || updating}
              className="flex-1 h-[40px] px-3.5 rounded-[10px] border border-[var(--border)] outline-none bg-[var(--bg-input)] text-[var(--text-primary)] text-[14px] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-60 transition-all"
            />
            {isAdmin && (
              <button
                type="button"
                onClick={handleRename}
                disabled={updating || roomName === selectedChat.name}
                className="h-[40px] px-4 rounded-[10px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Save
              </button>
            )}
          </div>
        </div>

        {/* Add Members Search */}
        {isAdmin && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">Add members</label>
            <input
              type="text"
              placeholder="Search users..."
              onChange={(e) => handleSearch(e.target.value)}
              disabled={updating}
              className="w-full h-[40px] px-3.5 rounded-[10px] border border-[var(--border)] outline-none bg-[var(--bg-input)] text-[var(--text-primary)] text-[14px] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
            />
            <div className="max-h-32 overflow-y-auto flex flex-col gap-1 mt-1">
              {loading ? (
                <p className="text-[12px] text-[var(--text-secondary)] text-center py-2">Searching...</p>
              ) : (
                searchResult?.slice(0, 3).map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleAddUser(user)}
                    className="flex items-center gap-3 p-2 rounded-[8px] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors border border-[var(--border)]"
                  >
                    <Avatar src={user.profilePic} text={user.username.charAt(0).toUpperCase()} size="w-7 h-7" />
                    <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1">{user.username}</span>
                    <span className="text-[12px] font-medium text-[var(--accent)]">Add</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[var(--text-secondary)]">Members ({selectedChat.members.length})</label>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {selectedChat.members.map((u) => {
              const isGroupAdmin = 
                String(u._id) === String(selectedChat.admin) || 
                String(u._id) === String(selectedChat.admin?._id);
              return (
                <div key={u._id} className="flex items-center justify-between p-2.5 rounded-[8px] bg-[var(--bg-input)] border border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={u.profilePic} text={u.username.charAt(0).toUpperCase()} size="w-8 h-8" />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">{u.username} {String(u._id) === String(currentUserId) && "(You)"}</span>
                      <span className="text-[11px] text-[var(--text-secondary)]">{isGroupAdmin ? "Admin" : "Member"}</span>
                    </div>
                  </div>
                  {isAdmin && !isGroupAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(u)}
                      disabled={updating}
                      className="text-[12px] font-medium text-[var(--danger)] hover:underline px-2 py-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Delete Group */}
        {isAdmin && (
          <div className="mt-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Are you sure you want to delete this group?")) {
                  try {
                    setUpdating(true);
                    await axios.delete(`${BackendUrl}/api/chat/${selectedChat._id}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success("Group deleted successfully!");
                    setTimeout(() => window.location.reload(), 800);
                  } catch (error) {
                    toast.error(error.response?.data?.message || "Failed to delete group");
                    setUpdating(false);
                  }
                }
              }}
              disabled={updating}
              className="w-full h-10 rounded-[10px] font-medium text-[13px] text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger)]/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Delete group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSettingsModal;
