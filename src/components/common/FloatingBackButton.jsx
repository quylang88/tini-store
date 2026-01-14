import React from 'react';
import { ChevronRight } from 'lucide-react';

const FloatingBackButton = ({
  onClick,
  ariaLabel = 'Quay lại',
  className = '',
}) => {
  // Nút back nổi dùng chung để tái sử dụng giữa các màn hình.
  // Ưu tiên hiệu ứng chạm (active) thay cho hover để thân thiện với màn hình cảm ứng.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`fixed right-4 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-700 shadow-lg border border-amber-200 active:scale-95 active:bg-amber-50 transition ${className}`}
    >
      {/* Icon quay lại, xoay sang trái để trực quan hơn. */}
      <ChevronRight className="rotate-180" />
    </button>
  );
};

export default FloatingBackButton;
