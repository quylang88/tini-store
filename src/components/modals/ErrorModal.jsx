import React, { useMemo } from "react";
import ModalShell from "./ModalShell";
import useModalCache from "../../hooks/ui/useModalCache";

// Modal báo lỗi riêng cho các trường hợp nhập sai hoặc thiếu dữ liệu
const ErrorModal = ({ open, title, message, onClose }) => {
  // Gom nhóm dữ liệu cần cache
  const dataToCache = useMemo(() => ({ title, message }), [title, message]);

  // Sử dụng hook để cache dữ liệu cho animation đóng
  const cachedData = useModalCache(dataToCache, open);

  // Nếu chưa có dữ liệu nào (lần đầu render và open=false), không render nội dung rỗng
  if (!cachedData?.title && !cachedData?.message) return null;

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="p-4 border-b border-rose-100 bg-rose-50">
        <div className="text-lg font-bold text-rose-700">
          {cachedData.title}
        </div>
      </div>
      <div className="p-4 text-sm text-gray-600 leading-relaxed">
        {cachedData.message}
      </div>
    </ModalShell>
  );
};

export default ErrorModal;
