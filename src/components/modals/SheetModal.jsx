import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import useMountTransition from "../../hooks/useMountTransition";

// SheetModal: Modal dạng trượt từ dưới lên (Bottom Sheet).
// Animation: Slide Up (translate-y-full -> translate-y-0).
// Dùng cho: Action (nhập liệu) và View Only (xem chi tiết).
const SheetModal = ({
  open,
  onClose,
  children,
  title,
  footer,
  showCloseIcon = false,
  className = "",
}) => {
  const { shouldRender, active } = useMountTransition(open, 300);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      {/* Animation: 
          - Enter: translate-y-0 (Slide Up), ease-out
          - Exit: translate-y-full (Slide Down), ease-in
      */}
      <div
        className={`bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh] transition-transform duration-300 transform ${
          active
            ? "translate-y-0 sm:scale-100 ease-out"
            : "translate-y-full sm:scale-95 ease-in"
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseIcon) && (
          <div className="flex justify-between items-center p-5 pb-0">
            {title ? (
              <h3 className="font-bold text-lg text-rose-800">{title}</h3>
            ) : (
              <div />
            )}
            {showCloseIcon && (
              <button
                onClick={onClose}
                className="bg-rose-100 text-rose-900 p-1.5 rounded-full hover:bg-rose-200 active:scale-95 transition-all"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-2">{children}</div>

        {footer && (
          <div className="p-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SheetModal;
