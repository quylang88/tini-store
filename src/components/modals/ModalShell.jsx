import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  // Trạng thái active: kiểm soát animation CSS (opacity, scale).
  const [active, setActive] = useState(false);
  // Trạng thái closing: giữ modal trong DOM khi đang đóng (để chạy animation)
  const [isClosing, setIsClosing] = useState(false);

  // State để theo dõi props open trước đó nhằm phát hiện thay đổi
  const [prevOpen, setPrevOpen] = useState(open);

  // Logic Derived State:
  if (open !== prevOpen) {
    setPrevOpen(open);
    // Nếu đang mở -> đóng: set isClosing = true ngay trong render để tránh unmount
    if (prevOpen === true && open === false) {
      setIsClosing(true);
    }
    // Nếu đang đóng -> mở lại ngay lập tức: reset isClosing
    if (open === true && isClosing === true) {
      setIsClosing(false);
    }
  }

  useEffect(() => {
    if (open) {
      // Entry Animation:
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActive(true);
        });
      });
    } else {
      // Exit Animation:
      requestAnimationFrame(() => setActive(false));
      // Đợi animation exit hoàn tất (300ms) rồi mới gỡ khỏi DOM.
      const timer = setTimeout(() => {
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Render khi open = true HOẶC đang trong quá trình đóng (animation)
  const shouldRender = open || isClosing;

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
