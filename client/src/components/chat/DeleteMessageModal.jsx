import React from "react";
import { X } from "lucide-react";

const DeleteMessageModal = ({ isOpen, onClose, onConfirm, canDeleteForEveryone }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(11,20,26,0.5)] p-4 animate-[modalBackdrop_0.15s_ease-out]">
      <div className="bg-[var(--bg-panel)] w-full max-w-[380px] p-6 rounded-[14px] border border-[var(--border)] shadow-[var(--shadow-md)] flex flex-col animate-[modalContent_0.15s_cubic-bezier(0.2,0,0,1)] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-1 rounded-full hover:bg-[var(--bg-hover)]"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h3 className="text-[18px] font-semibold text-[var(--text-primary)] tracking-tight">
          Delete message?
        </h3>
        <p className="text-[14px] text-[var(--text-secondary)] mt-1 mb-6">
          Are you sure you want to delete this message?
        </p>

        <div className="flex flex-col gap-2 w-full">
          {canDeleteForEveryone && (
            <button
              type="button"
              onClick={() => onConfirm("everyone")}
              className="w-full h-10 rounded-[10px] bg-[var(--danger)] hover:opacity-90 text-white font-medium text-[14px] transition-all cursor-pointer"
            >
              Delete for everyone
            </button>
          )}
          
          <button
            type="button"
            onClick={() => onConfirm("me")}
            className="w-full h-10 rounded-[10px] border border-[var(--border-strong)] bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium text-[14px] transition-all cursor-pointer"
          >
            Delete for me
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 rounded-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] font-medium text-[14px] transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
