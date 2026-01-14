import React from 'react';
import ModalShell from './ModalShell';

// Modal thông tin nhẹ: không có nút, chỉ chạm ra ngoài để đóng.
const InfoModal = ({ open, title, message, onClose }) => (
  <ModalShell open={open} onClose={onClose}>
    <div className="p-4 border-b border-amber-100 bg-amber-50">
      <div className="text-lg font-bold text-amber-900">{title}</div>
    </div>
    <div className="p-4 text-sm text-gray-600 leading-relaxed">
      {message}
    </div>
  </ModalShell>
);

export default InfoModal;
