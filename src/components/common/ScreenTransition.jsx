import React from "react";
import { motion } from "framer-motion";

// Variants cho hiệu ứng slide giống iOS
const variants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-25%", // Vào từ phải (nếu direction > 0) hoặc từ trái
    opacity: 0,
    scale: 0.95, // Hơi nhỏ lại một chút
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
    opacity: 0, // Fade out để tạo chiều sâu
    scale: 0.95,
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
      className={`screen-transition will-change-transform absolute top-0 left-0 w-full h-full bg-inherit ${className}`}
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
      style={{
        background: "inherit", // Giữ màu nền để không bị trong suốt khi trượt
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScreenTransition;
