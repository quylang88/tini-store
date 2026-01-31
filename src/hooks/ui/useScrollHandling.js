import { useState, useRef, useCallback } from "react";

/**
 * useScrollHandling
 * Quản lý hiển thị các thành phần UI dựa trên hướng và vị trí cuộn.
 *
 * @param {Object} config
 * @param {'staged' | 'simple'} config.mode - 'staged' (Header ẩn sau khi cuộn một đoạn) hoặc 'simple' (chỉ ẩn TabBar/AddButton).
 * @param {Function} config.setTabBarVisible - Callback tùy chọn để điều khiển TabBar toàn cục.
 * @param {number} config.searchHideThreshold - Ngưỡng tùy chỉnh để ẩn thanh tìm kiếm (mặc định 60).
 * @param {number} config.tabBarHideThreshold - Ngưỡng cuộn tối thiểu trước khi ẩn TabBar (mặc định 100).
 * @param {boolean} config.showTabBarOnlyAtTop - Nếu true, chỉ hiện lại TabBar khi cuộn lên đến đỉnh trang (mặc định false).
 * @returns {Object} { isSearchVisible, isAddButtonVisible, handleScroll, isScrolled }
 */
const useScrollHandling = ({
  mode = "staged",
  setTabBarVisible,
  searchHideThreshold = 60,
  tabBarHideThreshold = 100,
  showTabBarOnlyAtTop = false,
} = {}) => {
  const [isSearchVisible, setSearchVisible] = useState(true); // Cho Header/Search
  const [isAddButtonVisible, setAddButtonVisible] = useState(true); // Cho FAB
  const [isScrolled, setIsScrolled] = useState(false); // Cho hiệu ứng bóng đổ Header

  const lastScrollTop = useRef(0);
  const scrollThreshold = 10; // Delta tối thiểu để kích hoạt thay đổi

  // Tối ưu hóa: Sử dụng useCallback để tránh tạo lại hàm handleScroll mỗi lần render
  // Điều này rất quan trọng vì handleScroll được truyền xuống component con (OrderCreateView)
  const handleScroll = useCallback(
    (e) => {
      const target = e.target;
      const currentScrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;

      const diff = currentScrollTop - lastScrollTop.current;
      const direction = diff > 0 ? "down" : "up";

      // Cập nhật 'isScrolled' (hiệu ứng shadow)
      setIsScrolled(currentScrollTop > 10);

      // Bỏ qua hiệu ứng rubber-band (cuộn âm)
      if (currentScrollTop < 0) return;

      // Bỏ qua khi nảy ở đáy trang
      const isNearBottom = currentScrollTop + clientHeight > scrollHeight - 50;

      // Kiểm tra ngưỡng/debounce
      if (Math.abs(diff) < scrollThreshold) return;

      // Logic kiểm tra xem có nên ẩn TabBar không (chỉ ẩn khi cuộn xuống qua ngưỡng)
      const shouldHideTabBar =
        direction === "down" && currentScrollTop > tabBarHideThreshold;

      if (mode === "simple") {
        // Chế độ Simple: Chỉ bật/tắt TabBar/FAB
        if (shouldHideTabBar) {
          setAddButtonVisible(false);
          if (setTabBarVisible) setTabBarVisible(false);
        } else if (direction === "up" && !isNearBottom) {
          // Chỉ hiện lại khi cuộn lên (và không ở đáy)
          setAddButtonVisible(true);
          if (setTabBarVisible) setTabBarVisible(true);
        }
      } else if (mode === "staged") {
        // Chế độ Staged:
        // Xuống -> TabBar ẩn ngay lập tức (nếu qua ngưỡng). Search ẩn sau ngưỡng riêng.
        // Lên -> Hiện lại tất cả.

        if (direction === "down") {
          // Ẩn TabBar nếu qua ngưỡng
          if (shouldHideTabBar) {
            setAddButtonVisible(false);
            if (setTabBarVisible) setTabBarVisible(false);
          }

          // Ẩn Search nếu cuộn xuống đủ sâu (qua ngưỡng)
          if (currentScrollTop > searchHideThreshold) {
            setSearchVisible(false);
          }
        } else {
          // Cuộn lên (Scrolling Up)
          if (!isNearBottom) {
            // Hiện lại FAB và Search
            setAddButtonVisible(true);
            setSearchVisible(true);

            // Xử lý logic hiện TabBar
            if (setTabBarVisible) {
              if (showTabBarOnlyAtTop) {
                // Chỉ hiện TabBar khi gần sát đỉnh trang (scrollTop < 20)
                if (currentScrollTop < 20) {
                  setTabBarVisible(true);
                }
              } else {
                // Mặc định: hiện ngay khi cuộn lên
                setTabBarVisible(true);
              }
            }
          }
        }
      }

      lastScrollTop.current = currentScrollTop;
    },
    [
      mode,
      setTabBarVisible,
      searchHideThreshold,
      tabBarHideThreshold,
      showTabBarOnlyAtTop,
    ],
  );

  // Helper để buộc reset (ví dụ: khi chuyển tab)
  const resetScrollState = useCallback(() => {
    setSearchVisible(true);
    setAddButtonVisible(true);
    if (setTabBarVisible) setTabBarVisible(true);
    setIsScrolled(false);
  }, [setTabBarVisible]);

  return {
    isSearchVisible,
    isAddButtonVisible,
    isScrolled,
    handleScroll,
    resetScrollState,
  };
};

export default useScrollHandling;
