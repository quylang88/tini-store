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
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isAddButtonVisible, setIsAddButtonVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollTop = useRef(0);

  // Reset trạng thái khi dữ liệu thay đổi (vd: sau khi xoá sản phẩm)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHeaderVisible(true);
      setIsHeaderExpanded(true);
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
    const direction = currentScrollTop > lastScrollTop.current ? "down" : "up";
    const isNearBottom = currentScrollTop + clientHeight > scrollHeight - 50;
    const scrollRange = scrollHeight - clientHeight;

    // Cập nhật trạng thái shadow cho header
    setIsScrolled(currentScrollTop > 10);

    const diff = currentScrollTop - lastScrollTop.current;

    // Bỏ qua các thay đổi nhỏ để tránh noise, trừ khi ở gần đỉnh
    // Với scroll down, ta cho phép xử lý ngay (diff > 0) để đảm bảo độ nhạy
    if (Math.abs(diff) > 2 || currentScrollTop < 50 || diff > 0) {
      if (diff > 0) {
        // SCROLL DOWN
        // Chỉ ẩn nếu nội dung đủ dài (tránh lỗi giật ngược trên danh sách ngắn)
        if (scrollRange > scrollThreshold) {
          // Giai đoạn 1: Thu gọn Filter, ẩn TabBar, ẩn AddButton
          // Bắt đầu thu gọn Filter ngay khi rời đỉnh (vd: > 20px) để tạo hiệu ứng "từ từ biến mất"
          if (currentScrollTop > 20) {
             setIsHeaderExpanded(false);
          }

          setIsAddButtonVisible(false);
          if (setTabBarVisible) setTabBarVisible(false);

          // Giai đoạn 2: Ẩn thanh Search (toàn bộ header) khi scroll sâu hơn một chút (vd: > 80px)
          if (currentScrollTop > 80) {
            setIsHeaderVisible(false);
          } else {
            // Giữ search bar khi mới scroll qua filter
            setIsHeaderVisible(true);
          }
        }
      } else if (!isNearBottom && diff < 0) {
        // SCROLL UP
        // 1. Luôn hiện thanh Search và Add Button ngay lập tức (tạo cảm giác mượt)
        setIsHeaderVisible(true);
        setIsAddButtonVisible(true);

        // 2. TabBar và Filter chỉ hiện khi về hẳn đầu trang (hoặc danh sách ngắn)
        if (scrollRange <= scrollThreshold || currentScrollTop < 10) {
           setIsHeaderExpanded(true);
           if (setTabBarVisible) setTabBarVisible(true);
        } else {
           // Nếu đang ở giữa danh sách, giữ Filter thu gọn
           setIsHeaderExpanded(false);
        }
      }
      lastScrollTop.current = currentScrollTop;
    } else {
       // Xử lý edge case: về đích chính xác
       if (currentScrollTop < 10) {
          setIsHeaderVisible(true);
          setIsHeaderExpanded(true);
          setIsAddButtonVisible(true);
          if (setTabBarVisible) setTabBarVisible(true);
       }
    }
  };

  return {
    isHeaderExpanded,
    isHeaderVisible,
    isAddButtonVisible,
    isScrolled,
    handleScroll,
  };
};

export default useScrollHandling;
