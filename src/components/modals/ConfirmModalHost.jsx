import React from 'react';
import ConfirmModal from './ConfirmModal';

const ConfirmModalHost = ({ modal, onClose }) => (
  <ConfirmModal
    open={Boolean(modal)}
    title={modal?.title}
    message={modal?.message}
    confirmLabel={modal?.confirmLabel}
    tone={modal?.tone}
    onCancel={onClose}
    onConfirm={() => {
      modal?.onConfirm?.();
      onClose();
    }}
  />
);

export default ConfirmModalHost;
