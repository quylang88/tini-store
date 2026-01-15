import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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
  // Trạng thái active: kiểm soát animation CSS (translate).
  const [active, setActive] = useState(false);
  // Trạng thái closing: giữ modal trong DOM khi đang đóng (để chạy animation)
  const [isClosing, setIsClosing] = useState(false);

  // State để theo dõi props open trước đó nhằm phát hiện thay đổi
  const [prevOpen, setPrevOpen] = useState(open);

  // Logic Derived State: (Replacement for getDerivedStateFromProps)
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
      // Sử dụng requestAnimationFrame để đảm bảo DOM đã render trạng thái ẩn (translate-y-full)
      // trước khi kích hoạt trạng thái hiện (translate-y-0).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActive(true);
        });
      });
    } else {
      // Exit Animation:
      requestAnimationFrame(() => setActive(false));
      // Đợi animation exit (slide down) hoàn tất 300ms rồi mới tắt render hoàn toàn
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
              <h3 className="font-bold text-lg text-amber-900">{title}</h3>
            ) : (
              <div />
            )}
            {showCloseIcon && (
              <button
                onClick={onClose}
                className="bg-amber-100 text-amber-900 p-1.5 rounded-full hover:bg-amber-200 active:scale-95 transition-all"
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
