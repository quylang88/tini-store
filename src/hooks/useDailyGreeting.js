import { useEffect } from 'react';
import { sendNotification } from '../utils/notificationUtils';

const STORAGE_KEY = 'last_daily_greeting_date';

const useDailyGreeting = (isAuthenticated) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    const sendGreeting = (dateStr) => {
      sendNotification("Chào buổi sáng! ☀️", {
        body: "Chúc bạn một ngày tốt lành! Đừng quên kiểm tra kho hàng và đơn hàng hôm nay nhé! 😄",
        icon: "/tiny-shop-icon-iphone.png",
        tag: "daily-greeting"
      });
      localStorage.setItem(STORAGE_KEY, dateStr);
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
      if (currentHour >= 8 && currentHour < 12) {
        sendGreeting(todayStr);
      }
    };

    // Check immediately on mount
    checkAndSendGreeting();

    // Check every minute.
    // Since we check a range (8-12) and check localStorage, it is safe to run frequently.
    // This ensures we catch the transition to 8:00 AM without needing exact minute matching.
    const interval = setInterval(checkAndSendGreeting, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);
};

export default useDailyGreeting;
