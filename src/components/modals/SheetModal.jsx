import React from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
import useMountTransition from "../../hooks/ui/useMountTransition";

// SheetModal: Modal dạng trượt từ dưới lên (Bottom Sheet).
// Animation: Slide Up (translate-y-full -> translate-y-0).
// Dùng cho: Action (nhập liệu) và View Only (xem chi tiết).
const SheetModal = ({
  open,
  onClose,
  children,
  title,
  footer,
  className = "",
}) => {
  const { shouldRender, active } = useMountTransition(open, 300);
  const controls = useDragControls();

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: active ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y"
        dragListener={false}
        dragControls={controls}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.5 }}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.y > 100 || velocity.y > 500) {
            onClose();
          }
        }}
        className={`bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Visual Cue */}
        <div
          className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
          aria-hidden="true"
          onPointerDown={(e) => controls.start(e)}
        >
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {title && (
          <div className="flex justify-between items-center px-5 pb-2">
            <h3 className="font-bold text-lg text-rose-900">{title}</h3>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-2 overscroll-contain">
          {children}
        </div>

        {footer && (
          <div className="p-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            {footer}
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  );
};

export default SheetModal;
