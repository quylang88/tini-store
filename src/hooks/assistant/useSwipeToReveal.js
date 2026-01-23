import { useRef } from "react";
import { useMotionValue, animate } from "framer-motion";

/**
 * Hook xử lý logic vuốt (swipe) để hiển thị nội dung ẩn (ví dụ: timestamp).
 * @returns {Object} { swipeX, handlers }
 */
export const useSwipeToReveal = () => {
  const swipeX = useMotionValue(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const diffX = touchCurrentX - touchStartX.current;
    const diffY = touchCurrentY - touchStartY.current;

    // Chỉ xử lý nếu swipe ngang nhiều hơn dọc
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      // Chỉ cho phép kéo sang trái (diffX < 0) để hiện nội dung bên phải
      if (diffX < 0) {
        // Clamp: max -70px (hoặc tham số hóa nếu cần)
        const newX = Math.max(diffX, -70);
        swipeX.set(newX);
      }
    }
  };

  const handleTouchEnd = () => {
    animate(swipeX, 0, { type: "spring", bounce: 0, duration: 0.3 });
  };

  return {
    swipeX,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
