import { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Avatar from "../ui/Avatar";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, X, Check } from "lucide-react";
import { getBackendUrl } from "../../utils/apiConfig";
import { getAuthToken } from "../../utils/authStorage";

const RoomModal = ({ isOpen, onClose, rooms, setRooms }) => {
  if (!isOpen) return null;

  const BackendUrl = getBackendUrl();
  const token = getAuthToken();

  const [roomName, setRoomName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cropping State
  const [profilePic, setProfilePic] = useState("");
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [isUploadingCrop, setIsUploadingCrop] = useState(false);

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResult([]);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(`${BackendUrl}/api/user?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResult(data);
    } catch {
      toast.error("Failed to load search results");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (userToAdd) => {
    if (selectedUsers.some((u) => u._id === userToAdd._id)) {
      toast.error("User already added");
      return;
    }
    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };

  const getCroppedImgBlob = (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

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
      }, 'image/jpeg');
    });
  };

  const handleUploadCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    try {
      setIsUploadingCrop(true);
      const blob = await getCroppedImgBlob(imgRef.current, completedCrop);
      const formData = new FormData();
      formData.append("file", blob, "group-pic.jpg");

      const { data } = await axios.post(`${BackendUrl}/api/messages/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setProfilePic(data.url);
      setImgSrc("");
      toast.success("Group picture applied!");
    } catch {
      toast.error("Failed to upload group picture");
    } finally {
      setIsUploadingCrop(false);
    }
  };

  const handleSubmit = async () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }
    if (selectedUsers.length < 1) {
      toast.error("Please select at least 1 more user to form a group");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data } = await axios.post(
        `${BackendUrl}/api/chat`,
        {
          isGroupChat: true,
          name: roomName,
          members: selectedUsers.map((m) => m._id),
          profilePic,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRooms([data, ...rooms]);
      
      setRoomName("");
      setSelectedUsers([]);
      setProfilePic("");
      onClose();
      toast.success("New Room Created!");
    } catch {
      toast.error("Failed to create the Chat!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,20,26,0.5)] p-4 animate-[modalBackdrop_0.15s_ease-out]">
      
      {/* Crop Modal Overlay */}
      {imgSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(11,20,26,0.6)] p-4 animate-[modalBackdrop_0.15s_ease-out]">
          <div className="bg-[var(--bg-panel)] p-6 rounded-[14px] border border-[var(--border)] shadow-[var(--shadow-md)] max-w-lg w-full flex flex-col items-center animate-[modalContent_0.15s_cubic-bezier(0.2,0,0,1)]">
            <h2 className="text-[18px] font-semibold mb-4 text-[var(--text-primary)]">Crop Group Picture</h2>
            <div className="max-h-[60vh] overflow-hidden w-full bg-black rounded-[10px] flex items-center justify-center">
              <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop>
                <img ref={imgRef} alt="Crop preview" src={imgSrc} onLoad={onImageLoad} className="max-h-[60vh] object-contain block" />
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
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)] tracking-tight">Create group</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="relative group cursor-pointer" onClick={() => document.getElementById("group-pic-upload").click()}>
            <div className="w-20 h-20 rounded-full border border-[var(--border)] p-1 bg-[var(--bg-input)] transition-transform duration-150">
              <Avatar src={profilePic} text={roomName ? roomName.charAt(0).toUpperCase() : "G"} size="w-full h-full" />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
            </div>
            <input type="file" id="group-pic-upload" className="hidden" accept="image/*" onChange={onSelectFile} />
          </div>
          <span className="text-[12px] text-[var(--text-secondary)]">Group picture (optional)</span>
        </div>

        <input 
          type="text" 
          placeholder="Group name" 
          value={roomName} 
          onChange={(e) => setRoomName(e.target.value)} 
          className="w-full h-[44px] px-3.5 rounded-[10px] border border-[var(--border)] outline-none bg-[var(--bg-input)] text-[var(--text-primary)] text-[14px] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all" 
        />

        <input 
          type="text" 
          placeholder="Search users to add" 
          onChange={(e) => handleSearch(e.target.value)} 
          className="w-full h-[44px] px-3.5 rounded-[10px] border border-[var(--border)] outline-none bg-[var(--bg-input)] text-[var(--text-primary)] text-[14px] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all" 
        />

        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedUsers.map((u) => (
              <span key={u._id} className="px-2.5 py-1 bg-[var(--accent-soft)] text-[var(--accent)] text-[12px] rounded-[6px] border border-[var(--accent)]/30 flex items-center gap-1.5 font-medium">
                {u.username}
                <button type="button" onClick={() => handleDelete(u)} className="text-[var(--accent)] hover:opacity-75 cursor-pointer">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="max-h-36 overflow-y-auto flex flex-col gap-0.5">
          {loading ? (
            <p className="text-[13px] text-[var(--text-secondary)] text-center py-2">Searching users...</p>
          ) : (
            searchResult?.slice(0, 4).map((user) => (
              <div 
                key={user._id} 
                onClick={() => handleAddUser(user)} 
                className="flex items-center gap-3 p-2 rounded-[8px] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
              >
                <Avatar src={user.profilePic} text={user.username.charAt(0).toUpperCase()} size="w-8 h-8" />
                <span className="text-[14px] text-[var(--text-primary)] truncate">{user.username}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-[10px] text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="h-10 px-5 rounded-[10px] font-semibold text-[14px] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomModal;
