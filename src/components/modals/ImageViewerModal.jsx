import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// ImageViewerModal: Hiển thị ảnh full màn hình (Lightbox)
// Hỗ trợ hiển thị tốt cả ảnh ngang và dọc nhờ object-contain
const ImageViewerModal = ({ src, alt, onClose }) => {
  // Đóng modal khi nhấn ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Nút đóng */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 active:scale-95 transition"
        aria-label="Đóng"
      >
        <X size={24} />
      </button>

      {/* Ảnh Full View */}
      <img
        src={src}
        alt={alt || "Full view"}
        className="max-w-full max-h-full object-contain cursor-zoom-out"
        onClick={(e) => e.stopPropagation()} // Click vào ảnh không đóng modal (hoặc tùy chọn)
      />
    </div>,
    document.body
  );
};

export default ImageViewerModal;
