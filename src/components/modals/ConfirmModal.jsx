import React from 'react';
import SheetModal from '../modals/SheetModal'; // Chuyển sang dùng SheetModal dạng bottom

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

  // Footer chứa 2 nút hành động
  const footer = (
    <div className="flex gap-2 w-full">
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
  );

  return (
    <SheetModal
      open={open}
      onClose={onCancel}
      title={title}
      footer={footer}
    >
      <div className="space-y-4">
        {message && <div className="text-sm text-gray-600 leading-relaxed">{message}</div>}
      </div>
    </SheetModal>
  );
};

export default ConfirmModal;
