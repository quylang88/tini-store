import { useState, useEffect, useCallback } from "react";
import { exportDataToJSON } from "../../utils/file/fileUtils";
import { sendNotification } from "../../utils/common/notificationUtils";

const useBackupLogic = ({
  isAuthenticated,
  isDataLoaded,
  products,
  orders,
  settings,
  setSettings,
  customers,
  chatSummary,
}) => {
  const [backupReminderOpen, setBackupReminderOpen] = useState(false);

  const handleBackupNow = useCallback(() => {
    const now = new Date().toISOString();
    const newSettings = { ...settings, lastBackupDate: now };
    setSettings(newSettings);
    // Pass extra data (customers, chatSummary) to backup function
    exportDataToJSON(products, orders, newSettings, customers, chatSummary);
    setBackupReminderOpen(false);
  }, [settings, products, orders, customers, chatSummary, setSettings]);

  useEffect(() => {
    if (!isAuthenticated || !isDataLoaded) return;

    const checkBackupStatus = () => {
      if (sessionStorage.getItem("hasCheckedBackup")) return;

      const lastBackup = settings.lastBackupDate
        ? new Date(settings.lastBackupDate).getTime()
        : 0;
      const now = Date.now();
      const daysSinceBackup = (now - lastBackup) / (1000 * 60 * 60 * 24);

      // Case A: Tự động sao lưu được bật và đã đến hạn
      if (
        settings.autoBackupInterval > 0 &&
        daysSinceBackup >= settings.autoBackupInterval
      ) {
        setBackupReminderOpen(true);
        sessionStorage.setItem("hasCheckedBackup", "true");
        return;
      }

      // Case B: Không bật tự động, nhưng quá hạn mặc định (7 ngày) -> Hiện nhắc nhở
      const isAutoOff = !settings.autoBackupInterval;
      const hasData = products.length > 0;

      if (isAutoOff && daysSinceBackup > 7 && hasData) {
        if ("Notification" in window && Notification.permission === "granted") {
          sendNotification("Nhắc nhở sao lưu", {
            body: "Bạn chưa sao lưu dữ liệu quá 7 ngày. Hãy mở app và sao lưu ngay để tránh mất dữ liệu!",
            requireInteraction: true,
          });
        } else {
          setBackupReminderOpen(true);
        }
        sessionStorage.setItem("hasCheckedBackup", "true");
      }
    };

    const timer = setTimeout(checkBackupStatus, 2000);
    return () => clearTimeout(timer);
  }, [
    isAuthenticated,
    isDataLoaded,
    products.length,
    settings.lastBackupDate,
    settings.autoBackupInterval,
  ]);

  return {
    backupReminderOpen,
    setBackupReminderOpen,
    handleBackupNow,
  };
};

export default useBackupLogic;
