import React from 'react';
import { createPortal } from 'react-dom';
import useModalPresence from '../../hooks/useModalPresence';

// Modal khung chung để đồng bộ style cho các popup xác nhận/nhập liệu
const ModalShell = ({
  open,
  onClose,
  children,
  align = 'center',
  containerClassName = '',
  paddingClassName = 'px-4 py-6',
  panelClassName = '',
  overlayClassName = '',
}) => {
  const { isMounted, animationState } = useModalPresence(open, 280);
  if (!isMounted) return null;

  // Chọn vị trí modal theo yêu cầu: center, start hoặc end.
  const alignClass = align === 'start' ? 'items-start' : align === 'end' ? 'items-end' : 'items-center';
  const overlayAnimationClass = animationState === 'enter' ? 'modal-overlay-enter' : 'modal-overlay-exit';
  const panelAnimationClass = animationState === 'enter' ? 'modal-panel-enter' : 'modal-panel-exit';

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] bg-black/40 ${overlayAnimationClass} ${overlayClassName}`}
      onClick={onClose}
    >
      {/* Bọc thêm lớp full-height để overlay phủ kín, tránh hở lớp nền ở đỉnh màn hình. */}
      <div className={`flex min-h-full justify-center ${paddingClassName} ${alignClass} ${containerClassName}`}>
        <div
          className={`w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden ${panelAnimationClass} ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Panel modal dùng chung, đã gắn animation để tránh lặp logic ở từng modal */}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ModalShell;
