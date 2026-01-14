import React from 'react';
import ModalShell from './ModalShell';

// Modal báo lỗi riêng cho các trường hợp nhập sai hoặc thiếu dữ liệu
const ErrorModal = ({ open, title, message, onClose }) => {
  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="p-4 border-b border-rose-100 bg-rose-50">
        <div className="text-lg font-bold text-rose-700">{title}</div>
      </div>
      <div className="p-4 text-sm text-gray-600 leading-relaxed">
        {message}
      </div>
    </ModalShell>
  );
};

export default ErrorModal;
