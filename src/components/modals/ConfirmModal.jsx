import React from 'react';
import ModalShell from './ModalShell';
import Button from '../common/Button';

// ConfirmModal: Modal xác nhận trung tâm (Center Modal).
// Không có nút X, chỉ có title, message và 2 nút ở dưới.
const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Đóng',
  tone = 'rose',
  onConfirm,
  onCancel
}) => {
  return (
    <ModalShell open={open} onClose={onCancel}>
      <div className="p-5 text-center">
        <h3 className="text-lg font-bold text-amber-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600 mb-6">{message}</p>}
        
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ConfirmModal;
