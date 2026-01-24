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

  // Hàm update history dựa trên lotId
  const updateHistoryRecord = useCallback((lotId, updates) => {
    if (!lotId) return;

    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      const currentHistory = stored ? JSON.parse(stored) : [];

      const recordIndex = currentHistory.findIndex(item => item.lotId === lotId);

      let nextHistory;

      if (recordIndex !== -1) {
        // Nếu tìm thấy, update record đó
        const updatedRecord = {
          ...currentHistory[recordIndex],
          ...updates,
          // Giữ nguyên timestamp gốc để bảo toàn "Ngày nhập", update ngày sửa
          lastEditedAt: new Date().toISOString(),
        };

        nextHistory = [...currentHistory];
        nextHistory[recordIndex] = updatedRecord;
      } else {
        // Nếu không tìm thấy (Legacy Data chưa có history), tạo mới (Upsert)
        // Điều này giúp migrate dần dữ liệu cũ sang hệ thống mới ngay khi user edit
        const newRecord = {
          id: crypto.randomUUID(),
          lotId, // Đảm bảo link đúng lotId
          timestamp: new Date().toISOString(), // Timestamp tạo history record này
          ...updates,
        };
        nextHistory = [newRecord, ...currentHistory];
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
      setHistory(nextHistory);

    } catch (error) {
      console.error("Failed to update import history:", error);
    }
  }, []);

  return {
    history,
    addHistoryRecord,
    updateHistoryRecord,
  };
};

export default useImportHistory;
