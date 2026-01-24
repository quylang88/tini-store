import { useState, useEffect, useCallback } from "react";

const HISTORY_KEY = "shop_import_history";
const HISTORY_CHANGE_EVENT = "shop_import_history_change";

const useImportHistory = () => {
  const [history, setHistory] = useState([]);

  // Hàm load dữ liệu từ localStorage
  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Failed to load import history:", error);
    }
  }, []);

  // Effect load ban đầu và lắng nghe sự thay đổi
  useEffect(() => {
    loadHistory();

    const handleStorageChange = (e) => {
      // Lắng nghe sự kiện custom nội bộ
      if (e.type === HISTORY_CHANGE_EVENT) {
        loadHistory();
      }
      // Lắng nghe sự kiện storage (cho phép sync giữa các tab)
      if (e.type === "storage" && e.key === HISTORY_KEY) {
        loadHistory();
      }
    };

    window.addEventListener(HISTORY_CHANGE_EVENT, handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(HISTORY_CHANGE_EVENT, handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadHistory]);

  const addHistoryRecord = useCallback((record) => {
    const newRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...record,
    };

    // Đọc lại từ localStorage mới nhất để đảm bảo không bị race condition
    // nếu có nhiều update gần như cùng lúc (dù JS là single thread nhưng cẩn tắc vô áy náy)
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      const currentHistory = stored ? JSON.parse(stored) : [];
      const nextHistory = [newRecord, ...currentHistory];

      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));

      // Dispatch event để các component khác sử dụng hook này tự update lại
      window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));

      // Update state cục bộ của instance này luôn
      setHistory(nextHistory);
    } catch (error) {
      console.error("Failed to save import history:", error);
    }
  }, []);

  return {
    history,
    addHistoryRecord,
  };
};

export default useImportHistory;
