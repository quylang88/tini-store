import React from 'react';
import ConfirmModal from './ConfirmModal';

const ConfirmModalHost = ({ modal, onClose }) => {
  if (!modal) return null;

  return (
    <ConfirmModal
      open={Boolean(modal)}
      title={modal.title}
      message={modal.message}
      confirmLabel={modal.confirmLabel}
      cancelLabel={modal.cancelLabel}
      tone={modal.tone}
      onConfirm={() => {
        modal.onConfirm();
        onClose();
      }}
      onCancel={modal.onCancel || onClose}
    />
  );
};

export default ConfirmModalHost;
