import { useState, useEffect, useCallback } from "react";

const HISTORY_KEY = "shop_import_history";

const useImportHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load import history:", error);
    }
  }, []);

  const addHistoryRecord = useCallback((record) => {
    const newRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...record,
    };

    setHistory((prev) => {
      const nextHistory = [newRecord, ...prev];
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      } catch (error) {
        console.error("Failed to save import history:", error);
      }
      return nextHistory;
    });
  }, []);

  return {
    history,
    addHistoryRecord,
  };
};

export default useImportHistory;
