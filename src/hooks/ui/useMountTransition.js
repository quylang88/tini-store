import { useState, useEffect } from "react";

/**
 * useMountTransition
 * Hook quản lý trạng thái mount/unmount và animation của component (Modal, TabBar).
 * Sử dụng pattern Derived State để tránh unmount component ngay lập tức khi isOpen = false,
 * cho phép animation exit chạy xong.
 *
 * @param {boolean} isOpen - Trạng thái mở/đóng mong muốn từ props.
 * @param {number} unmountDelay - Thời gian chờ animation exit (ms).
 * @returns {object} { shouldRender, active }
 * - shouldRender: Dùng để conditional render (&&).
 * - active: Dùng để toggle class CSS (opacity, translate).
 */
const useMountTransition = (isOpen, unmountDelay = 300) => {
  // Trạng thái active: kiểm soát animation CSS (opacity, translate).
  const [active, setActive] = useState(false);
  // Trạng thái isClosing: giữ component trong DOM khi đang đóng.
  const [isClosing, setIsClosing] = useState(false);
  // State theo dõi props isOpen trước đó.
  const [prevOpen, setPrevOpen] = useState(isOpen);

  // Derived State Logic:
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    // Nếu đang mở -> đóng: set isClosing = true ngay trong render
    if (prevOpen === true && isOpen === false) {
      setIsClosing(true);
    }
    // Nếu đang đóng -> mở lại ngay lập tức: reset isClosing
    if (isOpen === true && isClosing === true) {
      setIsClosing(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Entry Animation:
      // Sử dụng requestAnimationFrame lồng nhau để đảm bảo trình duyệt
      // đã paint frame đầu tiên (trạng thái ẩn) trước khi apply class active.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActive(true);
        });
      });
    } else {
      // Exit Animation:
      requestAnimationFrame(() => setActive(false));

      // Đợi animation xong mới unmount
      const timer = setTimeout(() => {
        setIsClosing(false);
      }, unmountDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, unmountDelay]);

  return {
    shouldRender: isOpen || isClosing,
    active,
  };
};

export default useMountTransition;
