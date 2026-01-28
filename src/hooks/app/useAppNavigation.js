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
    setActiveTab((prevTab) => {
      const currentOrder = TAB_ORDER[prevTab] ?? 0;
      const newOrder = TAB_ORDER[newTab] ?? 0;

      let newDirection = 0;
      if (newTab === "stats-detail") {
        newDirection = 1; // Push
      } else if (prevTab === "stats-detail") {
        newDirection = -1; // Pop
      } else {
        newDirection = newOrder > currentOrder ? 1 : -1;
      }
      setDirection(newDirection);

      // Cập nhật trạng thái hiển thị của TabBar
      if (newTab === "stats-detail") {
        setIsTabBarVisible(false);
      } else {
        setIsTabBarVisible(true);
      }

      return newTab;
    });
  }, []);

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
