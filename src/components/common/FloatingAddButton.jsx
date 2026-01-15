import React from "react";
import { Plus } from "lucide-react";

const FloatingAddButton = ({
  onClick,
  ariaLabel = "Thêm mới",
  className = "",
}) => {
  // Nút nổi dùng chung để tránh lặp UI giữa các màn hình.
  // Vị trí mặc định bám theo nút back ở màn tạo đơn.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-200 active:scale-95 transition ${className}`}
    >
      <Plus size={20} />
    </button>
  );
};

export default FloatingAddButton;
