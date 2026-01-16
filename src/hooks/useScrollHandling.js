import { useState, useRef, useEffect } from "react";

/**
 * Hook xử lý logic scroll để ẩn/hiện Header, TabBar và Floating Action Button.
 *
 * @param {Object} params
 * @param {Function} params.setTabBarVisible - Hàm set visibility của TabBar toàn cục.
 * @param {number} params.scrollThreshold - Ngưỡng độ dài danh sách tối thiểu để kích hoạt tính năng ẩn (mặc định 200px).
 * @param {any} params.dataDependency - Biến phụ thuộc (vd: products.length) để reset trạng thái khi dữ liệu thay đổi.
 */
const useScrollHandling = ({
  setTabBarVisible,
  scrollThreshold = 200,
  dataDependency = null,
}) => {
  // Removed isHeaderExpanded as Filter is now handled by native scroll
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAddButtonVisible, setIsAddButtonVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollTop = useRef(0);

  // Reset trạng thái khi dữ liệu thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHeaderVisible(true);
      setIsAddButtonVisible(true);
      if (setTabBarVisible) setTabBarVisible(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [dataDependency, setTabBarVisible]);

  const handleScroll = (e) => {
    const target = e.target;
    const currentScrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // Direction logic (unused locally but good for debugging)
    // const direction = currentScrollTop > lastScrollTop.current ? "down" : "up";

    const isNearBottom = currentScrollTop + clientHeight > scrollHeight - 50;
    const scrollRange = scrollHeight - clientHeight;

    // Cập nhật trạng thái shadow cho header (khi scroll qua phần search)
    setIsScrolled(currentScrollTop > 10);

    const diff = currentScrollTop - lastScrollTop.current;

    // Remove strict noise filter to ensure responsiveness on small scroll-ups
    if (Math.abs(diff) > 0 || currentScrollTop < 50) {
      if (diff > 0) {
        // SCROLL DOWN
        if (scrollRange > scrollThreshold) {
          setIsAddButtonVisible(false);
          if (setTabBarVisible) setTabBarVisible(false);

          // Ẩn thanh Search (sticky header) khi scroll sâu hơn
          // Ngưỡng 80px để cho phép Filter (trong list) cuộn hết trước khi ẩn search
          if (currentScrollTop > 80) {
            setIsHeaderVisible(false);
          } else {
            setIsHeaderVisible(true);
          }
        }
      } else if (!isNearBottom && diff < 0) {
        // SCROLL UP
        // Luôn hiện Search và Add Button ngay lập tức
        setIsHeaderVisible(true);
        setIsAddButtonVisible(true);

        // TabBar chỉ hiện khi về hẳn đầu trang
        if (scrollRange <= scrollThreshold || currentScrollTop < 10) {
           if (setTabBarVisible) setTabBarVisible(true);
        }
      }
      lastScrollTop.current = currentScrollTop;
    } else {
       // Xử lý edge case: về đích chính xác
       if (currentScrollTop < 10) {
          setIsHeaderVisible(true);
          setIsAddButtonVisible(true);
          if (setTabBarVisible) setTabBarVisible(true);
       }
    }
  };

  return {
    isHeaderVisible,
    isAddButtonVisible,
    isScrolled,
    handleScroll,
  };
};

export default useScrollHandling;
