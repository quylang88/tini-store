import React from 'react';

// Nút nổi dùng chung để tránh lặp lại vị trí/hiệu ứng giữa các màn hình.
const FloatingActionButton = ({ onClick, ariaLabel, className = '', children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={`fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-200 active:scale-95 transition-transform duration-200 ${className}`}
  >
    {children}
  </button>
);

export default FloatingActionButton;
