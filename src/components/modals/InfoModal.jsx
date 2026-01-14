import React, { useMemo } from 'react';
import ModalShell from './ModalShell';
import useModalCache from '../../hooks/useModalCache';

// Modal thông tin nhẹ: không có nút, chỉ chạm ra ngoài để đóng.
const InfoModal = ({ open, title, message, onClose }) => {
  // Gom nhóm dữ liệu cần cache
  const dataToCache = useMemo(() => ({ title, message }), [title, message]);

  // Sử dụng hook để cache dữ liệu cho animation đóng
  const cachedData = useModalCache(dataToCache, open);

  // Nếu chưa có dữ liệu nào thì không render
  if (!cachedData?.title && !cachedData?.message) return null;

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="p-4 border-b border-amber-100 bg-amber-50">
        <div className="text-lg font-bold text-amber-900">{cachedData.title}</div>
      </div>
      <div className="p-4 text-sm text-gray-600 leading-relaxed">
        {cachedData.message}
      </div>
    </ModalShell>
  );
};

export default InfoModal;
