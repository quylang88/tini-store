import React from 'react';
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
  if (!open) return null;

  const alignClass = align === 'start' ? 'items-start' : 'items-center';

  return createPortal(
    <div className="fixed inset-0 z-[90] bg-black/40" onClick={onClose}>
      {/* Bọc thêm lớp full-height để overlay phủ kín, tránh hở lớp nền ở đỉnh màn hình. */}
      <div className={`flex min-h-full justify-center ${paddingClassName} ${alignClass} ${containerClassName}`}>
        <div
          className={`w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ModalShell;
