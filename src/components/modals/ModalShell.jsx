import React from 'react';

// Modal khung chung để đồng bộ style cho các popup xác nhận/nhập liệu
const ModalShell = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/40" onClick={onClose}>
      {/* Bọc thêm lớp full-height để overlay phủ kín, tránh hở lớp nền ở đỉnh màn hình. */}
      <div className="flex min-h-full items-center justify-center px-4 py-6">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalShell;
