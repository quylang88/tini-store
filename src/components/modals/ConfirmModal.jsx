import React from 'react';
import ModalShell from './ModalShell';

// Modal xác nhận dùng chung cho các thao tác xoá/huỷ/thanh toán
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
  const toneClass = tone === 'danger'
    ? 'bg-red-500 text-white active:bg-red-600 shadow-red-200'
    : 'bg-rose-500 text-white active:bg-rose-600 shadow-rose-200';

  return (
    <ModalShell open={open} onClose={onCancel}>
      <div className="p-4 border-b border-amber-100 bg-amber-50">
        <div className="text-lg font-bold text-amber-900">{title}</div>
      </div>
      <div className="p-4 space-y-4">
        {message && <div className="text-sm text-gray-600 leading-relaxed">{message}</div>}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-amber-200 text-amber-700 font-semibold bg-white active:bg-amber-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-semibold shadow-md transition ${toneClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ConfirmModal;
