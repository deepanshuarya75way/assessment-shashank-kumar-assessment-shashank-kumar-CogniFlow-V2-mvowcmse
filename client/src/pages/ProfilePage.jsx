import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Avatar from "../components/ui/Avatar";
import { ArrowLeft, Save, X, Check } from "lucide-react";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getBackendUrl } from "../utils/apiConfig";
import { getAuthToken } from "../utils/authStorage";

const ProfilePage = () => {
  const navigate = useNavigate();
  const BackendUrl = getBackendUrl();
  const token = getAuthToken();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    profilePic: "",
  });

  // Cropping State
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [isUploadingCrop, setIsUploadingCrop] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${BackendUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          username: data.username || "",
          email: data.email || "",
          bio: data.bio || "",
          profilePic: data.profilePic || "",
        });
      } catch {
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [BackendUrl, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await axios.put(
        `${BackendUrl}/api/user/profile`,
        {
          username: formData.username,
          bio: formData.bio,
          profilePic: formData.profilePic,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

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
      makeAspectCrop(
        { unit: '%', width: 80 },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const generateCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement("canvas");
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
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

      const uploadData = new FormData();
      uploadData.append("file", croppedBlob, "profile-pic.jpg");

      const res = await axios.post(`${BackendUrl}/api/messages/upload`, uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      setFormData((prev) => ({ ...prev, profilePic: res.data.url }));
      setImgSrc("");
      toast.success("Profile photo cropped!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploadingCrop(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-secondary)] text-[14px]">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4 select-none">
      {/* Crop Modal */}
      {imgSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,20,26,0.6)] p-4 animate-[modalBackdrop_0.15s_ease-out]">
          <div className="bg-[var(--bg-panel)] p-6 rounded-[14px] border border-[var(--border)] shadow-[var(--shadow-md)] max-w-lg w-full flex flex-col items-center animate-[modalContent_0.15s_cubic-bezier(0.2,0,0,1)]">
            <h2 className="text-[18px] font-semibold mb-4 text-[var(--text-primary)]">Crop Profile Photo</h2>
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
                {isUploadingCrop ? "Uploading..." : <><Check size={16} /> Apply</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[440px] bg-[var(--bg-panel)] rounded-[14px] p-6 sm:p-8 shadow-[var(--shadow-md)] border border-[var(--border)] animate-[fadeIn_0.15s_ease]">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)}
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">Edit profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center mb-2">
            <div className="w-20 h-20 mb-2 rounded-full border border-[var(--border)] p-1 bg-[var(--bg-input)]">
              <Avatar src={formData.profilePic} text={formData.username.charAt(0).toUpperCase()} size="w-full h-full" />
            </div>
            <p className="text-[12px] text-[var(--text-secondary)]">Profile picture</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">Email address</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              disabled
              className="w-full h-[44px] px-3.5 rounded-[10px] bg-[var(--bg-input)] text-[var(--text-tertiary)] border border-[var(--border)] cursor-not-allowed text-[14px] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full h-[44px] px-3.5 rounded-[10px] bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-[14px] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Tell others about yourself"
              className="w-full p-3 rounded-[10px] bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all resize-none text-[14px] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">Change photo</label>
            <input
              type="file"
              id="profile-pic-upload"
              className="hidden"
              accept="image/*"
              onChange={onSelectFile}
            />
            <button
              type="button"
              onClick={() => document.getElementById("profile-pic-upload").click()}
              className="w-full h-[40px] px-3 rounded-[10px] border border-[var(--border-strong)] bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium text-[13px] transition-colors cursor-pointer"
            >
              Upload new photo
            </button>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-[44px] mt-2 flex items-center justify-center gap-2 rounded-[10px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-[15px] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving..." : (
              <>
                <Save size={16} /> Save changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
