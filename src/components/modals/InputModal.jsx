import React, { useEffect, useRef } from 'react';
import ModalShell from './ModalShell';

// Modal nhập liệu (ví dụ phí gửi) để thay thế prompt
const InputModal = ({
  open,
  title,
  message,
  error,
  value,
  onChange,
  confirmLabel = 'Lưu',
  cancelLabel = 'Đóng',
  onConfirm,
  onCancel,
  inputProps
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <ModalShell open={open} onClose={onCancel}>
      <div className="p-4 border-b border-amber-100 bg-amber-50">
        <div className="text-lg font-bold text-amber-900">{title}</div>
        {message && <div className="text-xs text-amber-600 mt-1">{message}</div>}
      </div>
      <div className="p-4 space-y-4">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm font-semibold text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
          {...inputProps}
        />
        {error && <div className="text-xs text-red-500">{error}</div>}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-amber-200 text-amber-700 font-semibold bg-white hover:bg-amber-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold shadow-md shadow-rose-200 hover:bg-rose-600 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default InputModal;
