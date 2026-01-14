import React from 'react';
import ModalShell from './ModalShell';

// Modal báo lỗi riêng cho các trường hợp nhập sai hoặc thiếu dữ liệu
const ErrorModal = ({ open, title, message, onClose }) => {
  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="p-4 border-b border-rose-100 bg-rose-50">
        <div className="text-lg font-bold text-rose-700">{title}</div>
      </div>
      <div className="p-4 space-y-4">
        {message && <div className="text-sm text-gray-600 leading-relaxed">{message}</div>}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-semibold shadow-md shadow-rose-200 active:bg-rose-600 transition"
        >
          Đã hiểu
        </button>
      </div>
    </ModalShell>
  );
};

export default ErrorModal;
