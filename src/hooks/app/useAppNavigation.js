import { useState, useCallback } from "react";

// Định nghĩa thứ tự tab để xác định hướng chuyển cảnh
const TAB_ORDER = {
  dashboard: 0,
  products: 1,
  assistant: 2,
  orders: 3,
  settings: 4,
  "stats-detail": 10, // Coi như màn hình con của dashboard
};

const useAppNavigation = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [direction, setDirection] = useState(0); // 1: phải sang trái (push), -1: trái sang phải (pop)
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  // Hàm chuyển tab có tính toán hướng animation
  const handleTabChange = useCallback((newTab) => {
    // Sử dụng activeTab hiện tại từ scope thay vì functional update
    // Điều này an toàn vì chúng ta không update activeTab nhiều lần trong 1 render cycle
    // và chúng ta cần giá trị hiện tại để tính toán direction.

    // Tính toán direction dựa trên tab CŨ (activeTab) và tab MỚI (newTab)
    const currentOrder = TAB_ORDER[activeTab] ?? 0;
    const newOrder = TAB_ORDER[newTab] ?? 0;

    let newDirection = 0;
    if (newTab === "stats-detail") {
      newDirection = 1; // Push
    } else if (activeTab === "stats-detail") {
      newDirection = -1; // Pop
    } else {
      newDirection = newOrder > currentOrder ? 1 : -1;
    }

    // Update các state
    setDirection(newDirection);
    setActiveTab(newTab);

    // Cập nhật trạng thái hiển thị của TabBar
    if (newTab === "stats-detail") {
      setIsTabBarVisible(false);
    } else {
      setIsTabBarVisible(true);
    }
  }, [activeTab]); // Thêm activeTab vào dependency

  return {
    activeTab,
    setActiveTab,
    direction,
    handleTabChange,
    isTabBarVisible,
    setIsTabBarVisible,
  };
};

export default useAppNavigation;
