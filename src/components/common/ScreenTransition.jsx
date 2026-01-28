import React from "react";
import { motion } from "framer-motion";

// Variants cho hiệu ứng slide giống iOS
const variants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-25%", // Vào từ phải (nếu direction > 0) hoặc từ trái
    opacity: 1, // Đảm bảo không bị trong suốt khi bắt đầu (tránh chớp trắng)
    scale: 1, // Giữ nguyên kích thước (tránh hở nền)
    zIndex: 2, // Đè lên màn hình cũ
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    zIndex: 2,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction) => ({
    x: direction < 0 ? "100%" : "-25%", // Ra về phải (nếu direction < 0) hoặc về trái
    opacity: 1, // Giữ nguyên độ đậm để tránh lộ nền trắng phía sau
    scale: 0.95, // Thu nhỏ nhẹ để tạo chiều sâu (giống iOS)
    zIndex: 1, // Nằm dưới màn hình mới vào
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  }),
};

const ScreenTransition = ({
  children,
  className = "",
  custom = 1,
  onSwipeBack,
}) => {
  return (
    <motion.div
      custom={custom}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      className={`screen-transition absolute top-0 left-0 w-full h-full bg-rose-50 ${className}`}
      // Cấu hình gesture swipe back nếu có handler
      drag={onSwipeBack ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.5 }} // Cho phép kéo dãn sang phải
      onDragEnd={(e, { offset, velocity }) => {
        // Nếu kéo sang phải > 100px hoặc vận tốc nhanh
        if (onSwipeBack && (offset.x > 100 || velocity.x > 500)) {
          onSwipeBack();
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScreenTransition;
