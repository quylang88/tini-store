import React from 'react';
import SheetModal from '../modals/SheetModal'; // Dùng chung SheetModal
import ModalShell from './ModalShell';

const ConfirmModalHost = ({ modal, onClose }) => {
  // Nếu modal không có thông tin, không render gì
  if (!modal) return null;

  // Lấy các props từ đối tượng modal
  const {
    title,
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Huỷ',
    tone = 'rose',
    onConfirm,
    onCancel = onClose
  } = modal;

  const toneClass = tone === 'danger'
    ? 'bg-red-500 text-white active:bg-red-600 shadow-red-200'
    : 'bg-rose-500 text-white active:bg-rose-600 shadow-rose-200';

  const footer = (
    <div className="flex gap-2 w-full">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 rounded-xl border border-amber-200 text-amber-700 font-semibold bg-white active:bg-amber-50 transition"
      >
        {cancelLabel}
      </button>
      <button
        onClick={() => {
          onConfirm();
          onClose(); // Đóng modal sau khi confirm
        }}
        className={`flex-1 py-2.5 rounded-xl font-semibold shadow-md transition ${toneClass}`}
      >
        {confirmLabel}
      </button>
    </div>
  );

  return (
    <SheetModal
      open={Boolean(modal)}
      onClose={onClose}
      title={title}
      footer={footer}
    >
      <div className="text-sm text-gray-600 leading-relaxed">
        {message}
      </div>
    </SheetModal>
  );
};

export default ConfirmModalHost;
