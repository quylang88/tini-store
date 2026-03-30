import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ToggleButton = memo(
  ({
    isActive,
    onClick,
    activeIcon: ActiveIcon,
    inactiveIcon: InactiveIcon,
    label,
    className = "",
    // Dự phòng nếu chỉ truyền một component icon
    icon: SingleIcon,
  }) => {
    // Xác định icon cần hiển thị
    // Nếu đang active và có ActiveIcon -> dùng nó.
    // Ngược lại nếu inactive và có InactiveIcon -> dùng nó.
    // Cuối cùng dùng SingleIcon hoặc null.

    const CurrentIcon = isActive
      ? ActiveIcon || SingleIcon
      : InactiveIcon || SingleIcon;

    // Tạo key dựa trên tên component icon hoặc trạng thái active
    // Để AnimatePresence nhận biết sự thay đổi icon (ví dụ: mũi tên lên -> xuống)
    const iconKey = CurrentIcon
      ? CurrentIcon.displayName ||
        CurrentIcon.name ||
        (isActive ? "active" : "inactive")
      : "no-icon";

    return (
      <motion.button
        onClick={onClick}
        layout // Bật animation layout cho thay đổi kích thước/vị trí
        className={`relative flex items-center justify-center rounded-xl transition-colors w-[42px] h-[42px] border flex-shrink-0 ${className} ${
          isActive
            ? "bg-rose-200 border-rose-300 text-rose-800 shadow-sm"
            : "bg-rose-100 border-rose-200 text-rose-600 active:bg-rose-200"
        }`}
        whileTap={{ scale: 0.95 }}
        aria-label={label}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={iconKey}
            initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 15 }}
            transition={{ duration: 0.2 }}
          >
            {CurrentIcon && <CurrentIcon size={20} strokeWidth={2} />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    );
  },
);

ToggleButton.displayName = "ToggleButton";

export default ToggleButton;
