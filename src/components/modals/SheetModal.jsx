import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// SheetModal: Modal dạng trượt từ dưới lên (Bottom Sheet).
// Dùng cho:
// 1. Xem thông tin (View Only): Top bán chạy, Lịch sử nhập hàng, Chi tiết đơn hàng -> Không có nút X, nút Đóng ở footer.
// 2. Nhập liệu/Hành động (Action): Thêm/Sửa hàng, Xác nhận đơn -> Có nút X, 2 nút (Hủy/Lưu) ở footer.
const SheetModal = ({
  open,
  onClose,
  children,
  title,
  footer,
  showCloseIcon = false, // Mặc định tắt nút X để phù hợp với dạng View Only, dạng Action sẽ bật lên.
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
      className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center transition-opacity duration-300 ${
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
        {/* Header: Chỉ hiện nếu có title hoặc nút close */}
        {(title || showCloseIcon) && (
          <div className="flex justify-between items-center p-5 pb-2">
            {title ? <h3 className="font-bold text-lg text-amber-900">{title}</h3> : <div />}

            {/* Nút đóng (X) chỉ hiện khi showCloseIcon = true */}
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {children}
        </div>

        {/* Footer: Chứa các nút hành động, tự động padding bottom cho iPhone (safe area) */}
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
