import React from "react";
import { createPortal } from "react-dom";
import useMountTransition from "../../hooks/useMountTransition";

// ModalShell: Modal dạng popup hiển thị chính giữa màn hình (Center Modal).
// Animation: Zoom In + Fade (scale-95 opacity-0 -> scale-100 opacity-100).
// Dùng cho: Error, Info, Confirm.
const ModalShell = ({
  open,
  onClose,
  children,
  align = "center",
  containerClassName = "",
  paddingClassName = "px-4 py-6",
  panelClassName = "",
}) => {
  const { shouldRender, active } = useMountTransition(open, 300);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`flex min-h-full justify-center items-center ${paddingClassName} ${containerClassName}`}
      >
        {/* Animation: 
            - Enter: scale-95 -> scale-100 (Zoom In), ease-out (nhanh dần rồi chậm lại)
            - Exit: scale-100 -> scale-95 (Zoom Out), ease-in (chậm rồi nhanh dần để biến mất dứt khoát)
        */}
        <div
          className={`w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden transform transition-all duration-300 ${
            active
              ? "scale-100 opacity-100 ease-out"
              : "scale-95 opacity-0 ease-in"
          } ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalShell;
