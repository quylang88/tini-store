import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Modal khung chung để đồng bộ style cho các popup xác nhận/nhập liệu
const ModalShell = ({
  open,
  onClose,
  children,
  align = 'center',
  containerClassName = '',
  paddingClassName = 'px-4 py-6',
  panelClassName = '',
}) => {
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      // Đợi animation kết thúc (300ms) trước khi unmount
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!shouldRender) return null;

  const alignClass = align === 'start' ? 'items-start' : 'items-center';

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] bg-black/40 transition-opacity duration-300 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      {/* Bọc thêm lớp full-height để overlay phủ kín, tránh hở lớp nền ở đỉnh màn hình. */}
      <div className={`flex min-h-full justify-center ${paddingClassName} ${alignClass} ${containerClassName}`}>
        <div
          className={`w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden transform transition-all duration-300 ${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          } ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Panel modal dùng chung, đã gắn animation để tránh lặp logic ở từng modal */}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ModalShell;
