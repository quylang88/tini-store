import { useEffect } from "react";
import { sendNotification } from "../utils/notificationUtils";

const STORAGE_KEY = "last_daily_greeting_date";

const useDailyGreeting = (isAuthenticated) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    const sendGreeting = (dateStr) => {
      sendNotification("Chào buổi sáng! ☀️", {
        body: "Chúc bạn một ngày tốt lành! Đừng quên kiểm tra kho hàng và đơn hàng hôm nay nhé! 😄",
        icon: "/tiny-shop-icon-iphone.png",
        tag: "daily-greeting",
      });
      localStorage.setItem(STORAGE_KEY, dateStr);
    };

    const scheduleNotificationTrigger = async () => {
      // Experimental: Notification Triggers API (Chrome/Android)
      // Allows scheduling a local notification even if the app is closed.
      // We check if TimestampTrigger is defined on window to avoid ReferenceError
      if (
        "serviceWorker" in navigator &&
        "showTrigger" in Notification.prototype &&
        typeof TimestampTrigger !== "undefined"
      ) {
        const registration = await navigator.serviceWorker.ready;

        // Calculate next 8:00 AM
        const now = new Date();
        const nextGreeting = new Date();
        nextGreeting.setHours(8, 0, 0, 0);

        if (now > nextGreeting) {
          nextGreeting.setDate(nextGreeting.getDate() + 1);
        }

        const timestamp = nextGreeting.getTime();

        try {
          await registration.showNotification("Chào buổi sáng! ☀️", {
            body: "Chúc bạn một ngày tốt lành! Đừng quên kiểm tra kho hàng và đơn hàng hôm nay nhé! 😄",
            icon: "/tiny-shop-icon-iphone.png",
            tag: "daily-greeting-scheduled",
            // eslint-disable-next-line no-undef
            showTrigger: new TimestampTrigger(timestamp),
          });
          console.log("Scheduled local notification for:", nextGreeting);
        } catch (e) {
          // API might be missing or permission denied
          console.log("Scheduling failed", e);
        }
      }
    };

    const checkAndSendGreeting = () => {
      const now = new Date();
      const todayStr = now.toDateString(); // "Mon Jan 01 2024"
      const lastGreetingDate = localStorage.getItem(STORAGE_KEY);

      // If already greeted today, do nothing
      if (lastGreetingDate === todayStr) {
        return;
      }

      const currentHour = now.getHours();

      // Target window: 8:00 AM - 11:59 AM
      // This is the fallback for when the user opens the app in the morning.
      if (currentHour >= 8 && currentHour < 12) {
        sendGreeting(todayStr);
      }
    };

    // Check immediately on mount
    checkAndSendGreeting();

    // Attempt to schedule the "Offline" trigger
    scheduleNotificationTrigger();

    // Check every minute (Fallback for "App Open" scenario)
    const interval = setInterval(checkAndSendGreeting, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);
};

export default useDailyGreeting;
