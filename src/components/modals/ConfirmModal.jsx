import React from 'react';
import ModalShell from './ModalShell';

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
  const toneClass = tone === 'danger'
    ? 'bg-red-500 text-white active:bg-red-600 shadow-red-200'
    : 'bg-rose-500 text-white active:bg-rose-600 shadow-rose-200';

  return (
    <ModalShell open={open} onClose={onCancel}>
      <div className="p-5 text-center">
        <h3 className="text-lg font-bold text-amber-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600 mb-6">{message}</p>}

        <div className="flex gap-3">
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
