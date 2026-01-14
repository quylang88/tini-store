import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// SheetModal: Modal dạng trượt từ dưới lên, full width, bo góc trên.
// Dùng cho các chi tiết đơn hàng, danh sách top, review đơn hàng.
const SheetModal = ({
  open,
  onClose,
  children,
  title,
  footer,
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      // Đợi animation chạy xong (300ms) mới unmount
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] bg-black/40 flex items-end sm:items-center justify-center backdrop-blur-sm transition-opacity duration-300 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh] transition-transform duration-300 transform ${
          open ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 pb-2">
          {title && <h3 className="font-bold text-lg text-amber-900">{title}</h3>}
          {/* Nút đóng */}
          <button
            onClick={onClose}
            className="bg-amber-100 text-amber-900 p-1.5 rounded-full hover:bg-amber-200 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {children}
        </div>

        {/* Footer */}
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
