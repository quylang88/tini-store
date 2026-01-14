import React from 'react';
import ConfirmModal from './ConfirmModal';
import useModalCache from '../../hooks/useModalCache';

const ConfirmModalHost = ({ modal, onClose }) => {
  // Giữ lại nội dung modal cũ để hiển thị trong lúc đang đóng (animation fade-out)
  const cachedModal = useModalCache(modal, Boolean(modal));

  if (!cachedModal) return null;

  return (
    <ConfirmModal
      open={Boolean(modal)} // Điều khiển hiển thị dựa trên modal hiện tại (null -> đóng)
      title={cachedModal.title}
      message={cachedModal.message}
      confirmLabel={cachedModal.confirmLabel}
      cancelLabel={cachedModal.cancelLabel}
      tone={cachedModal.tone}
      onConfirm={() => {
        cachedModal.onConfirm();
        onClose();
      }}
      onCancel={cachedModal.onCancel || onClose}
    />
  );
};

export default ConfirmModalHost;
